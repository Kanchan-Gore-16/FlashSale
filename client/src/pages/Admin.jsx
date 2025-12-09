import { useQuery } from '@tanstack/react-query';
import { fetchAdminMetrics } from '../api.js';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
} from 'recharts';

export default function Admin() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['adminMetrics'],
        queryFn: fetchAdminMetrics,
        refetchInterval: 5000,
    });

    if (isLoading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3">Loading admin metrics...</p>
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="alert alert-danger">Failed to load admin metrics.</div>
        );
    }

    const {
        totalHoldsCreated,
        holdsExpired,
        confirmedOrders,
        oversellAttemptsBlocked,
        throttleBlocked,
        stockPerProduct,
        chart,
    } = data;

    // Format chart buckets to HH:MM
    const chartData = (chart || []).map((c) => {
        const d = new Date(c.bucket);
        const label = d.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
        });
        return {
            time: label,
            sold: c.sold,
            expired: c.expired,
        };
    });

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">Admin Console</h2>
                <span className="badge bg-secondary">Auto-refresh every 5s</span>
            </div>

            {/* Top stats */}
            <div className="row g-3 mb-4">
                <StatCard
                    label="Total Holds Created"
                    value={totalHoldsCreated}
                    variant="primary"
                />
                <StatCard
                    label="Holds Expired"
                    value={holdsExpired}
                    variant="warning"
                />
                <StatCard
                    label="Confirmed Orders"
                    value={confirmedOrders}
                    variant="success"
                />
                <StatCard
                    label="Oversell Attempts Blocked"
                    value={oversellAttemptsBlocked}
                    variant="danger"
                />
                <StatCard
                    label="Throttle Blocked"
                    value={throttleBlocked}
                    variant="secondary"
                />
            </div>

            {/* Chart: sold vs expired over last hour */}
            <div className="card mb-4 shadow-sm">
                <div className="card-header">
                    <h5 className="mb-0">Sold vs Expired (last hour)</h5>
                </div>
                <div className="card-body" style={{ height: 300 }}>
                    {chartData.length === 0 ? (
                        <p className="text-muted mb-0">
                            No confirmed/expired orders in the last hour.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="sold"
                                    name="Sold (qty)"
                                    stroke="#0d6efd"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expired"
                                    name="Expired (qty)"
                                    stroke="#dc3545"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Stock table with pending/confirmed/expired per product */}
            <div className="card shadow-sm">
                <div className="card-header">
                    <h5 className="mb-0">Stock & Orders per Product</h5>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-striped mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Sale Status</th>
                                    <th>Total Stock</th>
                                    <th>Live Stock</th>
                                    <th>Pending Holds</th>
                                    <th>Confirmed</th>
                                    <th>Expired</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockPerProduct.map((p) => (
                                    <tr key={p.productId}>
                                        <td>{p.name}</td>
                                        <td>
                                            <span
                                                className={
                                                    'badge ' +
                                                    (p.saleStatus === 'LIVE'
                                                        ? 'bg-success'
                                                        : p.saleStatus === 'UPCOMING'
                                                            ? 'bg-warning text-dark'
                                                            : 'bg-secondary')
                                                }
                                            >
                                                {p.saleStatus}
                                            </span>
                                        </td>
                                        <td>{p.totalStock}</td>
                                        <td>
                                            <span
                                                className={
                                                    'badge ' +
                                                    (p.liveStock === 0
                                                        ? 'bg-danger'
                                                        : p.liveStock < p.totalStock / 4
                                                            ? 'bg-warning text-dark'
                                                            : 'bg-success')
                                                }
                                            >
                                                {p.liveStock}
                                            </span>
                                        </td>
                                        <td>{p.pending}</td>
                                        <td>{p.confirmed}</td>
                                        <td>{p.expired}</td>
                                    </tr>
                                ))}
                                {stockPerProduct.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted py-3">
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="card-footer small text-muted">
                    Table shows live inventory and order status counts per product.
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, variant = 'primary' }) {
    return (
        <div className="col-12 col-md-6 col-lg-3">
            <div className={`card border-${variant} h-100 shadow-sm`}>
                <div className={`card-body text-${variant}`}>
                    <div className="small text-muted mb-1">{label}</div>
                    <div className="fs-4 fw-bold">{value}</div>
                </div>
            </div>
        </div>
    );
}
