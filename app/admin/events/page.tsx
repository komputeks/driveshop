import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAdminEvents } from "@/lib/adminApi";

export default async function AdminEventsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  const events = await getAdminEvents(session.user.email);

  return (
    <div className="p-8">

      <h1 className="text-2xl font-bold mb-4">
        Events
      </h1>

      <div className="overflow-x-auto bg-white rounded shadow">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <Th>Item</Th>
              <Th>Type</Th>
              <Th>User</Th>
              <Th>Page</Th>
              <Th>Date</Th>
            </tr>
          </thead>

          <tbody>

            {events.map((e: any, i: number) => (
              <tr key={i} className="border-t">

                <Td>{e.itemId}</Td>
                <Td>{e.type}</Td>
                <Td>{e.userEmail}</Td>
                <Td className="truncate max-w-xs">
                  {e.pageUrl}
                </Td>
                <Td>{e.createdAt}</Td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

/* Helpers */

function Th({ children }: any) {
  return <th className="p-3 text-left">{children}</th>;
}

function Td({ children }: any) {
  return <td className="p-3">{children}</td>;
}