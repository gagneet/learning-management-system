/**
 * Update Overdue Catch-Ups
 * 
 * This script runs daily to update catch-up packages that are past their
 * due date but still have status PENDING or IN_PROGRESS to OVERDUE.
 * 
 * Schedule: Daily at 3:00 AM
 * Command: node scripts/updateOverdueCatchups.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateOverdueCatchups() {
  console.log(`[${new Date().toISOString()}] Starting overdue catch-ups update...`);

  try {
    const now = new Date();

    // Find catch-ups that are overdue
    const result = await prisma.catchUpPackage.updateMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
      data: {
        status: "OVERDUE",
      },
    });

    console.log(`✓ Updated ${result.count} catch-up package(s) to OVERDUE status`);

    // Get details of overdue catch-ups for reporting
    const overdueCatchups = await prisma.catchUpPackage.findMany({
      where: {
        status: "OVERDUE",
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            centreId: true,
          },
        },
        attendanceRecord: {
          include: {
            session: {
              select: {
                title: true,
                startDate: true,
              },
            },
          },
        },
      },
      take: 10, // Show first 10 for summary
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total overdue catch-ups: ${result.count}`);
    
    if (overdueCatchups.length > 0) {
      console.log(`\n   Recent overdue catch-ups:`);
      overdueCatchups.forEach((catchup, index) => {
        const daysOverdue = Math.floor((now - catchup.dueDate) / (1000 * 60 * 60 * 24));
        console.log(`   ${index + 1}. ${catchup.student.name} - "${catchup.title}" (${daysOverdue} days overdue)`);
      });
    }

    console.log(`[${new Date().toISOString()}] Overdue catch-ups update completed\n`);

    // TODO: Send reminder notifications to students and parents
    if (result.count > 0) {
      console.log(`📧 TODO: Send reminder notifications for ${result.count} overdue catch-up(s)`);
    }

    return { updated: result.count };
  } catch (error) {
    console.error("Fatal error in overdue catch-ups update:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  updateOverdueCatchups()
    .then((result) => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = { updateOverdueCatchups };
