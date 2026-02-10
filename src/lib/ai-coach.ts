/**
 * AI Coach Service
 * Generates, adapts, and suggests workouts using OpenAI/Claude
 * All outputs are in Markdown format
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { AICoachRequest, AICoachResponse, WorkoutHistorySummary } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// System prompt for workout generation
const SYSTEM_PROMPT = `You are an expert fitness coach and personal trainer. Your role is to create, adapt, and suggest workouts based on user goals, history, and constraints.

IMPORTANT RULES:
1. ALL output must be in Markdown format following this exact structure:
   # Workout Name
   @duration Xm
   @goal <goal>

   ## Exercise Name
   SetsxReps @Weight
   rest Xs
   rpe X

   ## Superset (if applicable)
   Exercise 1: SetsxReps
   Exercise 2: SetsxReps
   rest Xs

2. Only use exercises from the provided exercise database
3. Consider user's available time and equipment
4. Factor in fatigue levels (1-10 scale) when programming
5. Follow periodization principles for progressive overload
6. Include appropriate rest times (60-180s depending on goal)
7. Suggest RPE for each exercise

EXERCISE DATABASE (use only these):
- Bench Press, Incline Bench Press, Dumbbell Press, Push-ups
- Squat, Front Squat, Leg Press, Lunges, Bulgarian Split Squat
- Deadlift, Romanian Deadlift, Hip Thrust
- Pull-ups, Lat Pulldown, Barbell Row, Dumbbell Row, Cable Row
- Overhead Press, Lateral Raise, Face Pull, Rear Delt Fly
- Bicep Curl, Hammer Curl, Tricep Extension, Tricep Pushdown
- Plank, Ab Wheel, Hanging Leg Raise, Cable Crunch
- Cardio: Running, Cycling, Rowing, Jump Rope

GOALS REFERENCE:
- Hypertrophy: 3-4 sets, 8-12 reps, 60-90s rest, RPE 7-8
- Strength: 4-6 sets, 3-6 reps, 2-3min rest, RPE 8-9
- Endurance: 2-3 sets, 15-20 reps, 30-60s rest, RPE 6-7
- Power: 3-5 sets, 3-5 reps, 2-3min rest, explosive movements`

// Generate a new workout
export async function generateWorkout(
  request: AICoachRequest,
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<AICoachResponse> {
  const userPrompt = buildGeneratePrompt(request)

  try {
    if (provider === 'anthropic') {
      return await generateWithAnthropic(userPrompt)
    }
    return await generateWithOpenAI(userPrompt)
  } catch (error) {
    console.error('AI generation error:', error)
    return {
      markdown: '',
      reasoning: 'Failed to generate workout',
      warnings: ['AI service unavailable. Please try again later.'],
    }
  }
}

// Adapt existing workout based on feedback/fatigue
export async function adaptWorkout(
  currentWorkout: string,
  fatigueLevel: number,
  feedback?: string,
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<AICoachResponse> {
  const prompt = `Adapt the following workout based on:
- Current fatigue level: ${fatigueLevel}/10
${feedback ? `- User feedback: ${feedback}` : ''}

If fatigue is high (7+), reduce volume/intensity by 10-20%
If fatigue is low (1-3), consider slight increase

Current workout:
${currentWorkout}

Return the adapted workout in the same Markdown format.`

  try {
    if (provider === 'anthropic') {
      return await generateWithAnthropic(prompt)
    }
    return await generateWithOpenAI(prompt)
  } catch (error) {
    console.error('AI adaptation error:', error)
    return {
      markdown: currentWorkout,
      warnings: ['Could not adapt workout. Original returned.'],
    }
  }
}

// Suggest load/progression changes
export async function suggestProgression(
  history: WorkoutHistorySummary,
  currentPlan?: string,
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<AICoachResponse> {
  const prompt = `Based on the user's training history, suggest progressions:

History Summary:
- Recent sessions: ${history.recentSessions}
- Weekly volume: ${history.weeklyVolume}
- Frequency: ${history.frequencyPerWeek} sessions/week
- Top exercises: ${history.topExercises.map((e) => e.name).join(', ')}
- Recent PRs: ${history.recentPRs.join(', ') || 'None'}

${currentPlan ? `Current plan:\n${currentPlan}` : ''}

Provide:
1. Specific weight/rep progressions for key lifts
2. Volume adjustments if needed
3. Any exercise swaps to prevent plateaus
4. Weekly structure recommendations

Format as clear bullet points with reasoning.`

  try {
    if (provider === 'anthropic') {
      return await generateWithAnthropic(prompt, false)
    }
    return await generateWithOpenAI(prompt, false)
  } catch (error) {
    console.error('AI suggestion error:', error)
    return {
      markdown: '',
      warnings: ['Could not generate suggestions.'],
    }
  }
}

// Generate a periodized training plan
export async function generatePlan(
  weeks: number,
  goals: string[],
  daysPerWeek: number,
  equipment: string[],
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<AICoachResponse> {
  const prompt = `Create a ${weeks}-week periodized training plan:

Goals: ${goals.join(', ')}
Training days per week: ${daysPerWeek}
Available equipment: ${equipment.join(', ')}

Structure the plan with:
1. Week-by-week overview (volume/intensity progression)
2. Daily workout templates in Markdown format
3. Deload week if >4 weeks
4. Clear progression scheme

Output format:
# [Plan Name]
@weeks ${weeks}
@goal ${goals[0]}

## Week 1-2: Foundation Phase
[Description]

### Day 1: [Focus]
[Full workout in standard format]

### Day 2: [Focus]
[Full workout in standard format]

... continue for all days and weeks`

  try {
    if (provider === 'anthropic') {
      return await generateWithAnthropic(prompt)
    }
    return await generateWithOpenAI(prompt)
  } catch (error) {
    console.error('AI plan generation error:', error)
    return {
      markdown: '',
      warnings: ['Could not generate plan.'],
    }
  }
}

// Build prompt for workout generation
function buildGeneratePrompt(request: AICoachRequest): string {
  let prompt = 'Generate a workout with the following parameters:\n\n'

  if (request.goals?.length) {
    prompt += `Goals: ${request.goals.join(', ')}\n`
  }
  if (request.availableTime) {
    prompt += `Available time: ${request.availableTime} minutes\n`
  }
  if (request.equipment?.length) {
    prompt += `Equipment: ${request.equipment.join(', ')}\n`
  }
  if (request.fatigueLevel !== undefined) {
    prompt += `Current fatigue level: ${request.fatigueLevel}/10\n`
  }
  if (request.history) {
    prompt += `\nTraining history:\n`
    prompt += `- Weekly volume: ${request.history.weeklyVolume}\n`
    prompt += `- Frequency: ${request.history.frequencyPerWeek} sessions/week\n`
    prompt += `- Recent PRs: ${request.history.recentPRs.join(', ') || 'None'}\n`
  }
  if (request.preferences) {
    if (request.preferences.preferredExercises?.length) {
      prompt += `\nPreferred exercises: ${request.preferences.preferredExercises.join(', ')}\n`
    }
    if (request.preferences.avoidExercises?.length) {
      prompt += `Avoid exercises: ${request.preferences.avoidExercises.join(', ')}\n`
    }
  }

  prompt += '\nGenerate the workout in the standard Markdown format.'

  return prompt
}

// Generate with OpenAI
async function generateWithOpenAI(
  prompt: string,
  isWorkout = true
): Promise<AICoachResponse> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  })

  const content = response.choices[0]?.message?.content || ''

  // Extract markdown and any reasoning
  const { markdown, reasoning } = extractMarkdownAndReasoning(content, isWorkout)

  return {
    markdown,
    reasoning,
    suggestions: extractSuggestions(content),
    warnings: [],
  }
}

// Generate with Anthropic Claude
async function generateWithAnthropic(
  prompt: string,
  isWorkout = true
): Promise<AICoachResponse> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const content =
    response.content[0].type === 'text' ? response.content[0].text : ''

  const { markdown, reasoning } = extractMarkdownAndReasoning(content, isWorkout)

  return {
    markdown,
    reasoning,
    suggestions: extractSuggestions(content),
    warnings: [],
  }
}

// Extract markdown workout from AI response
function extractMarkdownAndReasoning(
  content: string,
  isWorkout: boolean
): { markdown: string; reasoning?: string } {
  if (!isWorkout) {
    return { markdown: content }
  }

  // Look for markdown code block
  const codeBlockMatch = content.match(/```(?:markdown)?\n([\s\S]*?)```/)
  if (codeBlockMatch) {
    const remainingContent = content.replace(codeBlockMatch[0], '').trim()
    return {
      markdown: codeBlockMatch[1].trim(),
      reasoning: remainingContent || undefined,
    }
  }

  // Look for workout starting with # Title
  const workoutMatch = content.match(/(#\s+.+[\s\S]*)/m)
  if (workoutMatch) {
    return { markdown: workoutMatch[1].trim() }
  }

  return { markdown: content }
}

// Extract suggestions from AI response
function extractSuggestions(content: string): string[] {
  const suggestions: string[] = []

  // Look for numbered or bulleted suggestions
  const lines = content.split('\n')
  for (const line of lines) {
    if (line.match(/^[\d\-\*•]\s*.*(suggest|recommend|consider|try)/i)) {
      suggestions.push(line.replace(/^[\d\-\*•]\s*/, '').trim())
    }
  }

  return suggestions
}

// Normalize messy workout text to standard format
export async function normalizeWorkout(
  messyText: string,
  provider: 'openai' | 'anthropic' = 'openai'
): Promise<AICoachResponse> {
  const prompt = `Convert the following messy workout notes into the standard Markdown format.

Fix any:
- Inconsistent exercise names (use proper names from the database)
- Unclear set/rep schemes
- Missing rest times (add appropriate defaults)
- Formatting issues

Messy input:
${messyText}

Output ONLY the formatted Markdown workout, nothing else.`

  try {
    if (provider === 'anthropic') {
      return await generateWithAnthropic(prompt)
    }
    return await generateWithOpenAI(prompt)
  } catch (error) {
    console.error('AI normalization error:', error)
    return {
      markdown: messyText,
      warnings: ['Could not normalize workout.'],
    }
  }
}
