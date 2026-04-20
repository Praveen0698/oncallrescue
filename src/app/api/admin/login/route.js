import { generateToken, apiSuccess, apiError } from "@/lib/utils";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return apiError("Username and password are required");
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return apiError("Admin credentials not configured on server", 500);
    }

    if (username !== adminUsername || password !== adminPassword) {
      return apiError("Invalid admin credentials", 401);
    }

    const token = generateToken({
      role: "admin",
      username: adminUsername,
    }, "24h");

    return apiSuccess({ token }, "Admin login successful");
  } catch (error) {
    return apiError(error.message, 500);
  }
}
