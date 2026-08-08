FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["TrainerApp.Api.csproj", "."]
RUN dotnet restore "TrainerApp.Api.csproj"
COPY . .
# publish buduje sam — bez osobnego `dotnet build` (szybszy obraz CI).
# RID linux-x64 wymagany przez PublishReadyToRun; framework-dependent (ASP.NET base image).
RUN dotnet publish "TrainerApp.Api.csproj" \
    -c $BUILD_CONFIGURATION \
    -o /app/publish \
    -r linux-x64 \
    --no-self-contained \
    --no-restore \
    /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "TrainerApp.Api.dll"]
