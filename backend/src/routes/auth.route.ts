import { Router } from "express";
import { validate } from "../middlewares/schema.validate.middleware.js";
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  updatePasswordSchema,
  updateProfileSchema,
} from "../schemas/auth.schema.js";
import { AuthController } from "../controllers/auth.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router: Router = Router();

router.post(
  "/register",
  validate({ body: registerSchema }),
  AuthController.register
);
router.post("/login", validate({ body: loginSchema }), AuthController.login);
router.post("/logout", validate({ body: logoutSchema }), AuthController.logout);
router.get("/me", isAuthenticated, AuthController.getProfile);
router.post(
  "/refresh-token",
  validate({ body: refreshTokenSchema }),
  AuthController.refreshToken
);
router.put(
  "/me",
  isAuthenticated,
  validate({ body: updateProfileSchema }),
  AuthController.updateProfile
);
router.put(
  "/update-password",
  isAuthenticated,
  validate({ body: updatePasswordSchema }),
  AuthController.updatePassword
);

export { router as authRouter };
