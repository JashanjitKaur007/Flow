import { Router } from "express";
import {
  isAdmin,
  isAdminOrStaff,
  isAuthenticated,
} from "../middlewares/auth.middleware.js";
import { DoctorClinicController } from "../controllers/doctor.clinic.controller.js";
import { validate } from "../middlewares/schema.validate.middleware.js";
import {
  createDoctorClinicSchema,
  createDoctorClinicStaffBodySchema,
  createDoctorClinicStaffParamsSchema,
  getDoctorClinicSchema,
  getDoctorClinicsSchema,
  getDoctorClinicStaffParamsSchema,
  updateDoctorClinicParamsSchema,
  updateDoctorClinicSchema,
} from "../schemas/doctor.clinic.schema.js";

const router: Router = Router();

router.post(
  "/",
  isAuthenticated,
  isAdmin,
  validate({ body: createDoctorClinicSchema }),
  DoctorClinicController.createClinic
);

router.patch(
  "/:clinicId",
  isAuthenticated,
  isAdmin,
  validate({
    params: updateDoctorClinicParamsSchema,
    body: updateDoctorClinicSchema,
  }),
  DoctorClinicController.updateDoctorClinic
);

router.get(
  "/",
  isAuthenticated,
  validate({ query: getDoctorClinicsSchema }),
  DoctorClinicController.getClinics
);

router.get(
  "/:clinicId",
  isAuthenticated,
  validate({ params: getDoctorClinicSchema }),
  DoctorClinicController.getClinic
);

router.post(
  "/:clinicId/staff",
  isAuthenticated,
  isAdmin,
  validate({
    params: createDoctorClinicStaffParamsSchema,
    body: createDoctorClinicStaffBodySchema,
  }),
  DoctorClinicController.createClinicStaff
);

router.get(
  "/:clinicId/staff",
  isAuthenticated,
  isAdminOrStaff,
  validate({ params: getDoctorClinicStaffParamsSchema }),
  DoctorClinicController.getClinicStaffMembers
);

export { router as clinicRouter };
