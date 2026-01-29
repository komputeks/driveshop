import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminUsers } from "@/lib/adminApi";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  const users = await getAdminUsers(session.user.email);

  return (
    <div className="p-8">

      <h1 className="text-2xl font-bold mb-4">
        Users
      </h1>

      <div className="overflow-x-auto bg-white rounded shadow">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Phone</Th>
              <Th>Created</Th>
            </tr>
          </thead>

          <tbody>

            {users.map((u: any, i: number) => (
              <tr key={i} className="border-t">

                <Td>{u.email}</Td>
                <Td>{u.name}</Td>
                <Td>{u.phone}</Td>
                <Td>{u.createdAt}</Td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

/* ========== Table Helpers ========== */

function Th({ children }: any) {
  return (
    <th className="p-3 text-left">
      {children}
    </th>
  );
}

function Td({ children }: any) {
  return (
    <td className="p-3">
      {children}
    </td>
  );
}