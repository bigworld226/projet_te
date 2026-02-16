import { PrismaClient, Permission, ApplicationStatus, PaymentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Début du seeding (Mode Test)...')

  // --- CONFIGURATION DES MOTS DE PASSE ---
  // On définit les mots de passe en clair ici pour les voir dans la console
  const PWD_ADMIN = 'admin123'
  const PWD_STAFF = 'staff123'
  const PWD_STUDENT = 'student123'

  const salt = bcrypt.genSaltSync(10)
  const hashAdmin = bcrypt.hashSync(PWD_ADMIN, salt)
  const hashStaff = bcrypt.hashSync(PWD_STAFF, salt)
  const hashStudent = bcrypt.hashSync(PWD_STUDENT, salt)

  // 1. Création des Rôles (IAM)
  const roles = [
    { name: 'SUPERADMIN', desc: 'Accès total', perms: [Permission.ALL_ACCESS] },
    { name: 'STUDENT', desc: 'Espace étudiant', perms: [] },
    { name: 'STUDENT_MANAGER', desc: 'Gère les dossiers', perms: [Permission.MANAGE_STUDENTS, Permission.VIEW_STUDENTS,Permission.MANAGE_DISCUSSIONS] },
    { name: 'QUALITY_OFFICER', desc: 'Vérifie les docs', perms: [Permission.MANAGE_DOCUMENTS, Permission.VALIDATE_DOCUMENTS] },
    { name: 'FINANCE_MANAGER', desc: 'Gère les sous', perms: [Permission.VIEW_FINANCES, Permission.MANAGE_FINANCES, Permission.VIEW_STUDENTS] },
    { name: 'SECRETARY', desc: 'Secrétaire', perms: [Permission.MANAGE_STUDENTS, Permission.VIEW_STUDENTS, Permission.MANAGE_DOCUMENTS] },
  ]

  const createdRoles: Record<string, string> = {}

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { permissions: r.perms },
      create: { name: r.name, description: r.desc, permissions: r.perms },
    })
    createdRoles[r.name] = role.id
  }

  // 2. Création des Universités
  const uni1 = await prisma.university.create({
    data: {
      name: 'Beijing Language and Culture University (BLCU)',
      city: 'Pékin',
      summary: 'Spécialiste Langues',
      costRange: '3000-4500 USD',
      imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756defeec',
    },
  })

  // 3. Création des Utilisateurs
  // ADMIN
  await prisma.user.upsert({
    where: { email: 'admin@agence.com' },
    update: { password: hashAdmin },
    create: {
      email: 'admin@agence.com',
      password: hashAdmin,
      fullName: 'Super Administrateur',
      roleId: createdRoles['SUPERADMIN'],
    },
  })

  // QUALITY OFFICER
  await prisma.user.upsert({
    where: { email: 'qualite@agence.com' },
    update: { password: hashStaff },
    create: {
      email: 'qualite@agence.com',
      password: hashStaff,
      fullName: 'Agent Qualité',
      roleId: createdRoles['QUALITY_OFFICER'],
    },
  })

  // STUDENT_MANAGER
  await prisma.user.upsert({
    where: { email: 'student_manager@gmail.com' },
    update: { password: hashStaff },
    create: {
      email: 'student_manager@gmail.com',
      password: hashStaff,
      fullName: 'Student Manager',
      roleId: createdRoles['STUDENT_MANAGER'],
    },
  })

  // SECRETARY
  await prisma.user.upsert({
    where: { email: 'secretaire@gmail.com' },
    update: { password: hashStaff },
    create: {
      email: 'secretaire@gmail.com',
      password: hashStaff,
      fullName: 'Secrétaire',
      roleId: createdRoles['SECRETARY'],
    },
  })

  // ÉTUDIANT DE TEST
  const testStudent = await prisma.user.upsert({
    where: { email: 'etudiant@test.com' },
    update: { password: hashStudent },
    create: {
      email: 'etudiant@test.com',
      password: hashStudent,
      fullName: 'Ouedraogo Jean',
      roleId: createdRoles['STUDENT'],
    },
  })

  // 4. Dossier et Conversation pour l'étudiant
  const app = await prisma.application.create({
    data: {
      userId: testStudent.id,
      universityId: uni1.id,
      status: ApplicationStatus.UNDER_REVIEW,
      progress: 30,
      paymentStatus: PaymentStatus.PENDING,
    }
  })

  await prisma.conversation.create({
    data: {
      applicationId: app.id,
      subject: "Suivi de dossier",
      participants: { create: [{ userId: testStudent.id }] }
    }
  })

  // --- AFFICHAGE FINAL ---
  console.log('\n' + '='.repeat(50))
  console.log('✅ SEEDING TERMINÉ AVEC SUCCÈS');
  console.log('='.repeat(50))
  console.log('UTILISEZ CES COMPTES POUR VOS TESTS :');
  
  console.table([
    { Rôle: 'SuperAdmin', Email: 'admin@agence.com', Password: PWD_ADMIN },
    { Rôle: 'Qualité', Email: 'qualite@agence.com', Password: PWD_STAFF },
    { Rôle: 'Étudiant', Email: 'etudiant@test.com', Password: PWD_STUDENT },
  ])
  console.log('='.repeat(50) + '\n')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })