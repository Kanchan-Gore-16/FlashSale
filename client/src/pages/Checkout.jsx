import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOrder, confirmOrder } from '../api.js';
import CountdownTimer from '../components/CountdownTimer.jsx';
import { useState } from 'react';

export default function Checkout() {
    const { orderId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [message, setMessage] = useState('');
    const [confirming, setConfirming] = useState(false);

    const { data: order, isLoading, isError } = useQuery({
        queryKey: ['order', orderId],
        queryFn: () => fetchOrder(orderId),
    });

    const handleConfirm = async () => {
        setConfirming(true);
        setMessage('');
        try {
            await confirmOrder(orderId);
            setMessage('Order confirmed successfully!');
            queryClient.invalidateQueries(['order', orderId]);
            queryClient.invalidateQueries(['liveProducts']);
            queryClient.invalidateQueries(['adminMetrics']);
        } catch (e) {
            setMessage(e.message);
            queryClient.invalidateQueries(['order', orderId]);
            queryClient.invalidateQueries(['liveProducts']);
        } finally {
            setConfirming(false);
        }
    };

    const holdExpiresAt = order?.holdExpiresAt || location.state?.holdExpiresAt;

    if (isLoading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3">Loading order...</p>
            </div>
        );
    }

    if (isError || !order) {
        return (
            <div className="alert alert-danger">
                Failed to load order. It may not exist.
            </div>
        );
    }

    const total = ((order.price * order.quantity) / 100).toFixed(2);

    return (
        <div className="row justify-content-center">
            <div className="col-lg-7">
                <div className="card shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Checkout</h5>
                        <span className="badge bg-secondary">Order #{order.id}</span>
                    </div>
                    <div className="card-body">
                        <div className="mb-3">
                            <span className="badge bg-info text-dark me-2">
                                {order.customerEmail}
                            </span>
                            <span
                                className={
                                    'badge ' +
                                    (order.status === 'pending'
                                        ? 'bg-warning text-dark'
                                        : order.status === 'confirmed'
                                            ? 'bg-success'
                                            : 'bg-secondary')
                                }
                            >
                                {order.status.toUpperCase()}
                            </span>
                        </div>

                        <h5>{order.productName}</h5>
                        <p className="text-muted">{order.description}</p>

                        <ul className="list-group mb-3">
                            <li className="list-group-item d-flex justify-content-between">
                                <span>Price per unit</span>
                                <strong>₹{(order.price / 100).toFixed(2)}</strong>
                            </li>
                            <li className="list-group-item d-flex justify-content-between">
                                <span>Quantity</span>
                                <strong>{order.quantity}</strong>
                            </li>
                            <li className="list-group-item d-flex justify-content-between">
                                <span>Total</span>
                                <strong>₹{total}</strong>
                            </li>
                        </ul>

                        {holdExpiresAt && order.status === 'pending' && (
                            <div className="alert alert-warning d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Hold active</strong>
                                    <br />
                                    Complete payment before the timer expires.
                                </div>
                                <span className="badge bg-dark fs-6">
                                    <CountdownTimer
                                        targetTime={holdExpiresAt}
                                        onExpire={() =>
                                            queryClient.invalidateQueries(['order', orderId])
                                        }
                                    />
                                </span>
                            </div>
                        )}

                        {order.status !== 'pending' && (
                            <div className="alert alert-info">
                                This order is no longer pending. Current status:{' '}
                                <strong>{order.status}</strong>.
                            </div>
                        )}

                        {message && (
                            <div
                                className={
                                    'alert mt-3 ' +
                                    (message.toLowerCase().includes('success')
                                        ? 'alert-success'
                                        : 'alert-danger')
                                }
                            >
                                {message}
                            </div>
                        )}
                    </div>
                    <div className="card-footer d-flex justify-content-between">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => navigate('/')}
                        >
                            Back to Store
                        </button>
                        {order.status === 'pending' && (
                            <button
                                className="btn btn-primary"
                                onClick={handleConfirm}
                                disabled={confirming}
                            >
                                {confirming ? 'Confirming...' : 'Confirm Order'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
