/**
 * Generate Catch-Up Packages
 * 
 * This script runs nightly to find attendance records marked as ABSENT
 * without corresponding catch-up packages and creates them.
 * 
 * Schedule: Daily at 2:00 AM
 * Command: node scripts/generateCatchups.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function generateCatchups() {
  console.log(`[${new Date().toISOString()}] Starting catch-up generation...`);

  try {
    // Find attendance records marked ABSENT without catch-up packages
    const absentRecords = await prisma.attendanceRecord.findMany({
      where: {
        status: "ABSENT",
        catchUpPackage: null,
      },
      include: {
        session: {
          include: {
            classCohort: {
              select: {
                name: true,
                subject: true,
              },
            },
            lesson: {
              include: {
                contents: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            centreId: true,
          },
        },
      },
    });

    console.log(`Found ${absentRecords.length} absent records without catch-ups`);

    let created = 0;
    let errors = 0;

    for (const record of absentRecords) {
      try {
        // Calculate due date (7 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);

        // Prepare resources from lesson contents
        const resources = record.session.lesson?.contents?.map((content) => ({
          id: content.id,
          title: content.title,
          type: content.type,
          url: content.url,
        })) || [];

        // Create catch-up package
        await prisma.catchUpPackage.create({
          data: {
            studentId: record.studentId,
            attendanceRecordId: record.id,
            title: `Catch-up: ${record.session.title || "Session"}`,
            description: record.session.description || `You missed the session on ${record.session.classCohort?.subject || ""}. Please review the materials and complete the catch-up work.`,
            dueDate,
            status: "PENDING",
            resources,
          },
        });

        // Create audit log
        await prisma.auditEvent.create({
          data: {
            userId: "system",
            userName: "System",
            userRole: "SUPER_ADMIN",
            action: "CREATE",
            resourceType: "CatchUpPackage",
            resourceId: record.id,
            afterState: {
              studentId: record.studentId,
              sessionId: record.sessionId,
              status: "PENDING",
            },
            centreId: record.student.centreId,
            metadata: {
              automated: true,
              reason: "Absent from session",
            },
          },
        });

        created++;
        console.log(`✓ Created catch-up for ${record.student.name} - Session: ${record.session.title}`);
      } catch (error) {
        errors++;
        console.error(`✗ Error creating catch-up for student ${record.studentId}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total absent records: ${absentRecords.length}`);
    console.log(`   Catch-ups created: ${created}`);
    console.log(`   Errors: ${errors}`);
    console.log(`[${new Date().toISOString()}] Catch-up generation completed\n`);

    return { created, errors, total: absentRecords.length };
  } catch (error) {
    console.error("Fatal error in catch-up generation:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  generateCatchups()
    .then((result) => {
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = { generateCatchups };
