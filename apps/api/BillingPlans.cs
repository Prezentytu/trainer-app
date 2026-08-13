namespace TrainerApp.Api;

public static class BillingPlans
{
    public const string Free = "free";
    public const string Starter = "starter";
    public const string Pro = "pro";
    public const string Studio = "studio";
    public const string Founding = "founding";
    public const string Dev = "dev";

    public sealed record PlanDef(string Key, string Name, int? ClientLimit, int MonthlyGrosze);

    public static readonly PlanDef[] Paid =
    [
        new(Starter, "15 osób", 15, 3900),
        new(Pro, "30 osób", 30, 9900),
        new(Studio, "50 osób", 50, 19900),
    ];

    public static PlanDef Resolve(string? key) => key switch
    {
        Starter => Paid[0],
        Pro => Paid[1],
        Studio => Paid[2],
        Founding => new(Founding, "Founding — 15 osób", 15, 0),
        Dev => new(Dev, "Konto deweloperskie", null, 0),
        _ => new(Free, "Darmowy — 5 osób", 5, 0),
    };

    public static bool IsPaidKey(string? key) =>
        key is Starter or Pro or Studio or Founding;

    public static IResult? RejectIfAtLimit(Trainer trainer, int clientCount)
    {
        var plan = Resolve(trainer.PlanKey);
        if (plan.ClientLimit is null) return null;
        if (clientCount < plan.ClientLimit.Value) return null;
        var next = plan.Key == Free
            ? "Przejdź na 39 zł za 15 osób, żeby dodać kolejną osobę."
            : plan.Key == Starter
                ? "Przejdź na 99 zł za 30 osób, żeby dodać kolejną osobę."
                : "Jesteś na limicie tego planu.";
        return Results.Conflict(new
        {
            message = $"Ten plan obejmuje {plan.ClientLimit} {(plan.ClientLimit == 1 ? "osobę" : "osób")}. {next}",
            code = "client_limit",
            clientLimit = plan.ClientLimit,
            clientCount,
            planKey = plan.Key,
        });
    }
}
