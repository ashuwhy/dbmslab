export default function AdminDashboard() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder cards */}
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">Total Users</dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">12</dd>
                    </div>
                </div>
                <div className="overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="truncate text-sm font-medium text-gray-500">Active Courses</dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">8</dd>
                    </div>
                </div>
            </div>
        </div>
    );
}
