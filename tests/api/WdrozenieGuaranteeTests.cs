using Xunit;

namespace TrainerApp.Api.Tests;

public class WdrozenieGuaranteeTests
{
    [Fact]
    public void Eligible_After14Days_WithoutCompletedSession()
    {
        var trainer = new Trainer
        {
            WdrozeniePaidAt = DateTime.UtcNow.AddDays(-15),
            WdrozenieCreditGrosze = 39000,
        };
        Assert.True(BillingService.IsGuaranteeEligible(trainer, hasCompletedSession: false));
    }

    [Fact]
    public void NotEligible_WhenSomeoneCompleted()
    {
        var trainer = new Trainer
        {
            WdrozeniePaidAt = DateTime.UtcNow.AddDays(-20),
            WdrozenieCreditGrosze = 39000,
        };
        Assert.False(BillingService.IsGuaranteeEligible(trainer, hasCompletedSession: true));
    }

    [Fact]
    public void NotEligible_Before14Days()
    {
        var trainer = new Trainer
        {
            WdrozeniePaidAt = DateTime.UtcNow.AddDays(-3),
            WdrozenieCreditGrosze = 39000,
        };
        Assert.False(BillingService.IsGuaranteeEligible(trainer, hasCompletedSession: false));
    }
}
