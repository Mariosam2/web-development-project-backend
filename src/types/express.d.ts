declare namespace Express {
  interface User {
    id: string;
    username: string;
    email: string;
    googleId?: string | null;
    password?: string | null;
    imageId?: string | null;
    firstname?: string | null;
    lastname?: string | null;
    tokenVersion?: number;
    resetPasswordToken?: string | null;
  }
}
