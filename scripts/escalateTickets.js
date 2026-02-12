/**
 * Escalate Overdue Tickets
 * 
 * This script runs daily to find tickets that are past their SLA due date
 * and haven't been resolved, marking them as ESCALATED.
 * 
 * Schedule: Daily at 1:00 AM
 * Command: node scripts/escalateTickets.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function escalateTickets() {
  console.log(`[${new Date().toISOString()}] Starting ticket escalation check...`);

  try {
    const now = new Date();

    // Find tickets that are overdue and not resolved/closed
    const overdueTickets = await prisma.ticket.findMany({
      where: {
        slaDueAt: {
          lt: now,
        },
        status: {
          notIn: ["RESOLVED", "CLOSED", "ESCALATED"],
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`Found ${overdueTickets.length} overdue tickets to escalate`);

    let escalated = 0;
    let errors = 0;

    for (const ticket of overdueTickets) {
      try {
        const oldStatus = ticket.status;

        // Update ticket status to ESCALATED
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: "ESCALATED",
          },
        });

        // Create audit event
        await prisma.auditEvent.create({
          data: {
            userId: "system",
            userName: "System",
            userRole: "SUPER_ADMIN",
            action: "ESCALATE",
            resourceType: "Ticket",
            resourceId: ticket.id,
            beforeState: {
              status: oldStatus,
            },
            afterState: {
              status: "ESCALATED",
            },
            centreId: ticket.centreId,
            metadata: {
              automated: true,
              reason: "SLA deadline exceeded",
              slaDueAt: ticket.slaDueAt,
              overdueBy: Math.floor((now - ticket.slaDueAt) / (1000 * 60)), // minutes
            },
          },
        });

        escalated++;
        
        const overdueMinutes = Math.floor((now - ticket.slaDueAt) / (1000 * 60));
        const overdueHours = Math.floor(overdueMinutes / 60);
        const overdueDays = Math.floor(overdueHours / 24);
        
        let overdueStr;
        if (overdueDays > 0) {
          overdueStr = `${overdueDays} day(s)`;
        } else if (overdueHours > 0) {
          overdueStr = `${overdueHours} hour(s)`;
        } else {
          overdueStr = `${overdueMinutes} minute(s)`;
        }

        console.log(`✓ Escalated ticket #${ticket.id}: "${ticket.title}" (Overdue by ${overdueStr})`);
        console.log(`  Created by: ${ticket.createdBy.name}`);
        if (ticket.assignedTo) {
          console.log(`  Assigned to: ${ticket.assignedTo.name}`);
        }
      } catch (error) {
        errors++;
        console.error(`✗ Error escalating ticket ${ticket.id}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total overdue tickets: ${overdueTickets.length}`);
    console.log(`   Tickets escalated: ${escalated}`);
    console.log(`   Errors: ${errors}`);
    console.log(`[${new Date().toISOString()}] Ticket escalation completed\n`);

    // TODO: Send email notifications to admins about escalated tickets
    if (escalated > 0) {
      console.log(`📧 TODO: Send email notifications for ${escalated} escalated ticket(s)`);
    }

    return { escalated, errors, total: overdueTickets.length };
  } catch (error) {
    console.error("Fatal error in ticket escalation:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  escalateTickets()
    .then((result) => {
      process.exit(result.errors > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}

module.exports = { escalateTickets };
