// Script pour corriger les permissions manquantes
// Exécuter avec: node fix-permissions.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPermissions() {
  console.log('🔧 Fixing SUPERADMIN permissions...');
  
  try {
    // Vérifier le rôle SUPERADMIN
    const superadminRole = await prisma.role.findUnique({
      where: { name: 'SUPERADMIN' },
    });
    
    if (!superadminRole) {
      console.error('❌ SUPERADMIN role not found');
      return;
    }
    
    console.log('📋 Current SUPERADMIN permissions:', superadminRole.permissions);
    
    // S'assurer que ALL_ACCESS est présent
    if (!superadminRole.permissions.includes('ALL_ACCESS')) {
      console.log('⚠️ ALL_ACCESS not found, adding it...');
      
      const updated = await prisma.role.update({
        where: { name: 'SUPERADMIN' },
        data: {
          permissions: ['ALL_ACCESS', ...superadminRole.permissions],
        },
      });
      
      console.log('✅ Updated SUPERADMIN permissions:', updated.permissions);
    } else {
      console.log('✅ SUPERADMIN already has ALL_ACCESS');
    }
    
    // Vérifier aussi les autres rôles admin
    const roles = await prisma.role.findMany({
      where: {
        NOT: { name: 'STUDENT' },
      },
    });
    
    console.log('\n📊 All non-student roles:');
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.permissions.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPermissions();
