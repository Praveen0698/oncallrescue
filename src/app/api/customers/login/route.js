import dbConnect from "@/lib/mongodb";
import { Customer } from "@/lib/models";
import { verifyPassword, generateToken, apiSuccess, apiError } from "@/lib/utils";

export async function POST(request) {
  try {
    await dbConnect();
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return apiError("Phone and password are required");
    }

    const customer = await Customer.findOne({ phone });
    if (!customer) {
      return apiError("No account found with this phone number", 404);
    }

    if (!customer.password) {
      return apiError("Password not set. Please complete your registration first.", 400);
    }

    const isValid = await verifyPassword(password, customer.password);
    if (!isValid) {
      return apiError("Invalid password", 401);
    }

    const token = generateToken({
      id: customer._id,
      role: "customer",
      phone: customer.phone,
      name: customer.fullName,
    });

    return apiSuccess({
      token,
      customer: {
        id: customer._id,
        fullName: customer.fullName,
        phone: customer.phone,
        profileComplete: customer.profileComplete,
      },
    }, "Login successful");
  } catch (error) {
    return apiError(error.message, 500);
  }
}
