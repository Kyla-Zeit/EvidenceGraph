using EvidenceGraph.Infrastructure.Data;
using EvidenceGraph.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace EvidenceGraph.Tests;

public class AuditChainTests
{
    private EvidenceGraphDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<EvidenceGraphDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new EvidenceGraphDbContext(options);
    }

    [Fact]
    public async Task AuditChain_AppendsSequentially_AndVerifiesIntact()
    {
        // Arrange
        using var db = CreateDbContext();
        var auditService = new AuditService(db, NullLogger<AuditService>.Instance);
        var userId = Guid.NewGuid();
        var caseId = Guid.NewGuid();

        // Act
        var ev1 = await auditService.RecordEventAsync(userId, "CaseCreated", "InvestigationCase", caseId.ToString(), new { Title = "Case Alpha" }, caseId);
        var ev2 = await auditService.RecordEventAsync(userId, "EvidenceUploaded", "EvidenceItem", "EV-001", new { Sha256 = "abc123" }, caseId);
        var ev3 = await auditService.RecordEventAsync(userId, "EntityConfirmed", "Entity", "Alex Mercer", new { Type = "Person" }, caseId);

        // Assert
        ev1.SequenceNumber.Should().Be(1);
        ev2.SequenceNumber.Should().Be(2);
        ev3.SequenceNumber.Should().Be(3);

        ev2.PreviousHash.Should().Be(ev1.EntryHash);
        ev3.PreviousHash.Should().Be(ev2.EntryHash);

        var (isValid, total, brokenSeq, firstHash, latestHash, msg) = await auditService.VerifyAuditChainAsync();
        isValid.Should().BeTrue();
        total.Should().Be(3);
        brokenSeq.Should().BeNull();
        firstHash.Should().Be(ev1.EntryHash);
        latestHash.Should().Be(ev3.EntryHash);
    }

    [Fact]
    public async Task AuditChain_DetectsTampering_WhenEventModified()
    {
        // Arrange
        using var db = CreateDbContext();
        var auditService = new AuditService(db, NullLogger<AuditService>.Instance);
        var userId = Guid.NewGuid();

        var ev1 = await auditService.RecordEventAsync(userId, "CaseCreated", "InvestigationCase", "1", new { Note = "Clean" });
        var ev2 = await auditService.RecordEventAsync(userId, "EvidenceUploaded", "EvidenceItem", "2", new { Note = "Clean" });

        // Act: Tamper with ev1 structured details in database directly
        var recordToTamper = await db.AuditEvents.FirstAsync(a => a.SequenceNumber == 1);
        recordToTamper.StructuredDetails = "{\"Note\":\"TAMPERED_BY_ATTACKER\"}";
        await db.SaveChangesAsync();

        // Assert
        var (isValid, total, brokenSeq, _, _, msg) = await auditService.VerifyAuditChainAsync();
        isValid.Should().BeFalse();
        brokenSeq.Should().Be(1);
        msg.Should().Contain("Hash tampering detected");
    }
}
