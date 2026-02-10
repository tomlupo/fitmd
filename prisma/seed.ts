import { PrismaClient, ExerciseType, ExerciseUnit } from '@prisma/client'

const prisma = new PrismaClient()

const exercises = [
  // Chest
  {
    name: 'Bench Press',
    aliases: ['Flat Bench', 'Barbell Bench Press', 'BB Bench'],
    muscles: ['Chest', 'Triceps', 'Front Delts'],
    equipment: ['Barbell', 'Bench'],
    tags: ['compound', 'push', 'strength'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
    description: 'Horizontal pressing movement targeting the chest',
  },
  {
    name: 'Incline Bench Press',
    aliases: ['Incline Press', 'Incline BB Press'],
    muscles: ['Upper Chest', 'Front Delts', 'Triceps'],
    equipment: ['Barbell', 'Incline Bench'],
    tags: ['compound', 'push', 'strength'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Dumbbell Press',
    aliases: ['DB Press', 'Flat Dumbbell Press', 'DB Bench'],
    muscles: ['Chest', 'Triceps', 'Front Delts'],
    equipment: ['Dumbbells', 'Bench'],
    tags: ['compound', 'push', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Incline Dumbbell Press',
    aliases: ['Incline DB Press'],
    muscles: ['Upper Chest', 'Front Delts', 'Triceps'],
    equipment: ['Dumbbells', 'Incline Bench'],
    tags: ['compound', 'push', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Push-ups',
    aliases: ['Pushups', 'Press-ups'],
    muscles: ['Chest', 'Triceps', 'Front Delts', 'Core'],
    equipment: [],
    tags: ['compound', 'push', 'bodyweight'],
    type: ExerciseType.BODYWEIGHT,
    unit: ExerciseUnit.REPS,
  },

  // Back
  {
    name: 'Deadlift',
    aliases: ['Conventional Deadlift', 'DL'],
    muscles: ['Back', 'Glutes', 'Hamstrings', 'Traps'],
    equipment: ['Barbell'],
    tags: ['compound', 'pull', 'strength', 'power'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Romanian Deadlift',
    aliases: ['RDL', 'Stiff Leg Deadlift'],
    muscles: ['Hamstrings', 'Glutes', 'Lower Back'],
    equipment: ['Barbell'],
    tags: ['compound', 'pull', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Pull-ups',
    aliases: ['Pullups', 'Chin-ups'],
    muscles: ['Lats', 'Biceps', 'Rear Delts'],
    equipment: ['Pull-up Bar'],
    tags: ['compound', 'pull', 'bodyweight'],
    type: ExerciseType.BODYWEIGHT,
    unit: ExerciseUnit.REPS,
  },
  {
    name: 'Lat Pulldown',
    aliases: ['Pulldown', 'Cable Pulldown'],
    muscles: ['Lats', 'Biceps', 'Rear Delts'],
    equipment: ['Cable Machine'],
    tags: ['compound', 'pull', 'hypertrophy'],
    type: ExerciseType.CABLE,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Barbell Row',
    aliases: ['Bent Over Row', 'BB Row', 'Pendlay Row'],
    muscles: ['Back', 'Lats', 'Biceps', 'Rear Delts'],
    equipment: ['Barbell'],
    tags: ['compound', 'pull', 'strength'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Dumbbell Row',
    aliases: ['DB Row', 'One Arm Row', 'Single Arm Row'],
    muscles: ['Lats', 'Biceps', 'Rear Delts'],
    equipment: ['Dumbbell', 'Bench'],
    tags: ['compound', 'pull', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Cable Row',
    aliases: ['Seated Row', 'Seated Cable Row'],
    muscles: ['Back', 'Lats', 'Biceps'],
    equipment: ['Cable Machine'],
    tags: ['compound', 'pull', 'hypertrophy'],
    type: ExerciseType.CABLE,
    unit: ExerciseUnit.KG,
  },

  // Legs
  {
    name: 'Squat',
    aliases: ['Back Squat', 'Barbell Squat', 'BB Squat'],
    muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'],
    equipment: ['Barbell', 'Squat Rack'],
    tags: ['compound', 'legs', 'strength', 'power'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Front Squat',
    aliases: ['Front BB Squat'],
    muscles: ['Quads', 'Core', 'Glutes'],
    equipment: ['Barbell', 'Squat Rack'],
    tags: ['compound', 'legs', 'strength'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Leg Press',
    aliases: ['45 Degree Leg Press'],
    muscles: ['Quads', 'Glutes', 'Hamstrings'],
    equipment: ['Leg Press Machine'],
    tags: ['compound', 'legs', 'hypertrophy'],
    type: ExerciseType.MACHINE,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Lunges',
    aliases: ['Walking Lunges', 'Forward Lunges'],
    muscles: ['Quads', 'Glutes', 'Hamstrings'],
    equipment: ['Dumbbells'],
    tags: ['compound', 'legs', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Bulgarian Split Squat',
    aliases: ['BSS', 'Rear Foot Elevated Split Squat'],
    muscles: ['Quads', 'Glutes', 'Hamstrings'],
    equipment: ['Dumbbells', 'Bench'],
    tags: ['compound', 'legs', 'hypertrophy', 'unilateral'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Hip Thrust',
    aliases: ['Barbell Hip Thrust', 'Glute Bridge'],
    muscles: ['Glutes', 'Hamstrings'],
    equipment: ['Barbell', 'Bench'],
    tags: ['compound', 'glutes', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Calf Raise',
    aliases: ['Standing Calf Raise', 'Calf Press'],
    muscles: ['Calves'],
    equipment: ['Calf Raise Machine'],
    tags: ['isolation', 'calves', 'hypertrophy'],
    type: ExerciseType.MACHINE,
    unit: ExerciseUnit.KG,
  },

  // Shoulders
  {
    name: 'Overhead Press',
    aliases: ['OHP', 'Military Press', 'Shoulder Press'],
    muscles: ['Front Delts', 'Triceps', 'Upper Chest'],
    equipment: ['Barbell'],
    tags: ['compound', 'push', 'strength'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Lateral Raise',
    aliases: ['Side Raise', 'Lat Raise', 'Side Lateral'],
    muscles: ['Side Delts'],
    equipment: ['Dumbbells'],
    tags: ['isolation', 'shoulders', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Face Pull',
    aliases: ['Cable Face Pull'],
    muscles: ['Rear Delts', 'Traps', 'Rotator Cuff'],
    equipment: ['Cable Machine'],
    tags: ['isolation', 'shoulders', 'hypertrophy', 'prehab'],
    type: ExerciseType.CABLE,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Rear Delt Fly',
    aliases: ['Reverse Fly', 'Bent Over Fly'],
    muscles: ['Rear Delts'],
    equipment: ['Dumbbells'],
    tags: ['isolation', 'shoulders', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },

  // Arms
  {
    name: 'Bicep Curl',
    aliases: ['Barbell Curl', 'BB Curl', 'Curls'],
    muscles: ['Biceps'],
    equipment: ['Barbell'],
    tags: ['isolation', 'arms', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Hammer Curl',
    aliases: ['Neutral Grip Curl'],
    muscles: ['Biceps', 'Brachialis'],
    equipment: ['Dumbbells'],
    tags: ['isolation', 'arms', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Tricep Extension',
    aliases: ['Skullcrusher', 'Lying Tricep Extension'],
    muscles: ['Triceps'],
    equipment: ['Barbell', 'EZ Bar'],
    tags: ['isolation', 'arms', 'hypertrophy'],
    type: ExerciseType.FREE_WEIGHT,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Tricep Pushdown',
    aliases: ['Cable Pushdown', 'Rope Pushdown'],
    muscles: ['Triceps'],
    equipment: ['Cable Machine'],
    tags: ['isolation', 'arms', 'hypertrophy'],
    type: ExerciseType.CABLE,
    unit: ExerciseUnit.KG,
  },
  {
    name: 'Dips',
    aliases: ['Tricep Dips', 'Parallel Bar Dips'],
    muscles: ['Triceps', 'Chest', 'Front Delts'],
    equipment: ['Dip Station'],
    tags: ['compound', 'push', 'bodyweight'],
    type: ExerciseType.BODYWEIGHT,
    unit: ExerciseUnit.REPS,
  },

  // Core
  {
    name: 'Plank',
    aliases: ['Front Plank'],
    muscles: ['Core', 'Abs'],
    equipment: [],
    tags: ['core', 'isometric', 'bodyweight'],
    type: ExerciseType.BODYWEIGHT,
    unit: ExerciseUnit.TIME,
  },
  {
    name: 'Ab Wheel',
    aliases: ['Ab Rollout', 'Rollout'],
    muscles: ['Abs', 'Core'],
    equipment: ['Ab Wheel'],
    tags: ['core', 'hypertrophy'],
    type: ExerciseType.BODYWEIGHT,
    unit: ExerciseUnit.REPS,
  },
  {
    name: 'Hanging Leg Raise',
    aliases: ['Leg Raise', 'Hanging Knee Raise'],
    muscles: ['Abs', 'Hip Flexors'],
    equipment: ['Pull-up Bar'],
    tags: ['core', 'hypertrophy'],
    type: ExerciseType.BODYWEIGHT,
    unit: ExerciseUnit.REPS,
  },
  {
    name: 'Cable Crunch',
    aliases: ['Kneeling Cable Crunch'],
    muscles: ['Abs'],
    equipment: ['Cable Machine'],
    tags: ['core', 'hypertrophy'],
    type: ExerciseType.CABLE,
    unit: ExerciseUnit.KG,
  },

  // Cardio
  {
    name: 'Running',
    aliases: ['Jog', 'Run', 'Treadmill'],
    muscles: ['Legs', 'Cardio'],
    equipment: ['Treadmill'],
    tags: ['cardio', 'endurance'],
    type: ExerciseType.CARDIO,
    unit: ExerciseUnit.DISTANCE,
  },
  {
    name: 'Cycling',
    aliases: ['Bike', 'Spin', 'Stationary Bike'],
    muscles: ['Legs', 'Cardio'],
    equipment: ['Bike'],
    tags: ['cardio', 'endurance'],
    type: ExerciseType.CARDIO,
    unit: ExerciseUnit.DISTANCE,
  },
  {
    name: 'Rowing',
    aliases: ['Row Machine', 'Erg', 'Rowing Machine'],
    muscles: ['Back', 'Legs', 'Cardio'],
    equipment: ['Rowing Machine'],
    tags: ['cardio', 'endurance'],
    type: ExerciseType.CARDIO,
    unit: ExerciseUnit.DISTANCE,
  },
  {
    name: 'Jump Rope',
    aliases: ['Skipping', 'Rope Skipping'],
    muscles: ['Calves', 'Cardio'],
    equipment: ['Jump Rope'],
    tags: ['cardio', 'plyometric'],
    type: ExerciseType.PLYOMETRIC,
    unit: ExerciseUnit.TIME,
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing exercises
  await prisma.exercise.deleteMany()

  // Insert exercises
  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: exercise,
    })
    console.log(`  ✓ Created exercise: ${exercise.name}`)
  }

  console.log(`\n✅ Seeded ${exercises.length} exercises`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
