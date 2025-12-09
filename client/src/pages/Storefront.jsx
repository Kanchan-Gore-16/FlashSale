import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLiveProducts, createHold } from '../api.js';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CountdownTimer from '../components/CountdownTimer.jsx';

export default function Storefront() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [email, setEmail] = useState('');
    const [qty, setQty] = useState(1);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [error, setError] = useState('');

    const { data: products, isLoading, isError } = useQuery({
        queryKey: ['liveProducts'],
        queryFn: fetchLiveProducts,
        refetchInterval: 5000,
    });

    const handleBuyClick = (product) => {
        setSelectedProduct(product);
        setQty(1);
        setError('');
    };

    const handleCreateHold = async () => {
        if (!selectedProduct) return;
        if (!email) {
            setError('Please enter your email.');
            return;
        }

        try {
            setError('');
            const data = await createHold({
                productId: selectedProduct.id,
                email,
                qty,
            });

            navigate(`/checkout/${data.orderId}`, {
                state: { holdExpiresAt: data.holdExpiresAt },
            });

            queryClient.invalidateQueries(['liveProducts']);
        } catch (e) {
            setError(e.message);
        }
    };

    if (isLoading) {
        return (
            <div className="text-center mt-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-3">Loading products...</p>
            </div>
        );
    }

    if (isError) {
        return <div className="alert alert-danger">Failed to load products.</div>;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="mb-0">Live Flash Sales</h2>
            </div>

            <div className="card mb-4">
                <div className="card-body d-flex flex-column flex-md-row align-items-md-center">
                    <div className="flex-grow-1 mb-2 mb-md-0">
                        <label className="form-label mb-1">Your email</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="ms-md-3 mt-2 mt-md-0 text-muted small">
                        Used for tracking your order history.
                    </div>
                </div>
            </div>

            {products.length === 0 && (
                <div className="alert alert-info">No active sales right now.</div>
            )}

            <div className="row g-3">
                {products.map((p) => (
                    <div key={p.id} className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100 shadow-sm">
                            <div className="card-body d-flex flex-column">
                                <h5 className="card-title">{p.name}</h5>
                                <h6 className="card-subtitle mb-2 text-muted">
                                    ₹{(p.price / 100).toFixed(2)}
                                </h6>
                                <p className="card-text flex-grow-1">{p.description}</p>

                                <div className="mb-2">
                                    <span className="badge bg-secondary me-2">
                                        Stock: {p.liveStock} / {p.totalStock}
                                    </span>
                                    <span className="badge bg-info text-dark">
                                        Sold: {p.soldPercent}%
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <small className="text-muted">
                                        Sale ends in{' '}
                                        <span className="badge bg-dark">
                                            <CountdownTimer targetTime={p.saleEndsAt} />
                                        </span>
                                    </small>
                                </div>

                                <button
                                    className="btn btn-primary w-100 mt-auto"
                                    onClick={() => handleBuyClick(p)}
                                    disabled={p.liveStock <= 0}
                                >
                                    {p.liveStock <= 0 ? 'Sold Out' : 'Buy'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedProduct && (
                <div
                    className="modal fade show"
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    tabIndex="-1"
                    onClick={() => setSelectedProduct(null)}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Buy {selectedProduct.name}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedProduct(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-2">
                                    Price:{' '}
                                    <strong>
                                        ₹{(selectedProduct.price / 100).toFixed(2)}
                                    </strong>
                                </p>
                                <p className="mb-2">
                                    Available:{' '}
                                    <span className="badge bg-secondary">
                                        {selectedProduct.liveStock}
                                    </span>
                                </p>
                                <div className="mb-3">
                                    <label className="form-label">Quantity</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        min="1"
                                        max={selectedProduct.liveStock}
                                        value={qty}
                                        onChange={(e) =>
                                            setQty(Math.max(1, Number(e.target.value)))
                                        }
                                    />
                                </div>
                                {error && (
                                    <div className="alert alert-danger py-2">{error}</div>
                                )}
                                <small className="text-muted">
                                    This will create a 2-minute hold. Complete checkout before
                                    the timer expires.
                                </small>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setSelectedProduct(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleCreateHold}
                                >
                                    Create Hold &amp; Go to Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
