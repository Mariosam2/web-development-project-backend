import passport, { use } from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "@src/../lib/prisma";
import { getEnvOrThrow } from "@src/shared/helpers";

passport.use(
  new GoogleStrategy(
    {
      clientID: getEnvOrThrow("GOOGLE_CLIENT_ID"),
      clientSecret: getEnvOrThrow("GOOGLE_CLIENT_SECRET"),
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleImageUrl = profile.photos?.[0]?.value ?? null;
        const user = await prisma.user.upsert({
          where: { googleId: profile.id },
          update: {
            tokenVersion: { increment: 1 },
            username: profile.displayName,
            firstname: profile.name?.givenName ?? null,
            lastname: profile.name?.familyName ?? null,
          },
          create: {
            googleId: profile.id,
            email: profile.emails?.[0]?.value ?? "",
            username: profile.displayName,
            firstname: profile.name?.givenName ?? null,
            lastname: profile.name?.familyName ?? null,
            ...(googleImageUrl && {
              image: {
                create: {
                  filename: "google-avatar",
                  url: googleImageUrl,
                },
              },
            }),
          },
        });

        return done(null, user);
      } catch (error) {
        done(error);
      }
    },
  ),
);

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});
