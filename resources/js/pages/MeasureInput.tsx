// MeasureInput.jsx
// Step 1 — user enters width and height manually, then proceeds to AR placement
import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function MeasureInput() {
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [unit, setUnit] = useState('cm');
    const [errors, setErrors] = useState({});

    function validate() {
        const e = {};
        const w = parseFloat(width);
        const h = parseFloat(height);
        if (!width || isNaN(w) || w <= 0)
            e.width = 'Please enter a valid width';
        if (!height || isNaN(h) || h <= 0)
            e.height = 'Please enter a valid height';
        if (w > 1000) e.width = 'Width seems too large — check your value';
        if (h > 1000) e.height = 'Height seems too large — check your value';
        return e;
    }

    function handleSubmit(e) {
        e.preventDefault();
        const e2 = validate();
        if (Object.keys(e2).length) {
            setErrors(e2);
            return;
        }

        // Convert to cm if user entered mm or m
        let w = parseFloat(width);
        let h = parseFloat(height);
        if (unit === 'mm') {
            w /= 10;
            h /= 10;
        }
        if (unit === 'm') {
            w *= 100;
            h *= 100;
        }

        router.visit('/ar-place', {
            data: { w: w.toFixed(1), h: h.toFixed(1) },
        });
    }

    return (
        <div style={s.root}>
            {/* background grid pattern */}
            <div style={s.grid} />

            <div style={s.card}>
                {/* header */}
                <div style={s.header}>
                    <div style={s.iconWrap}>
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#608DB9"
                            strokeWidth="2"
                        >
                            <path d="M2 20h20M2 20V8l10-6 10 6v12M10 20v-6h4v6" />
                        </svg>
                    </div>
                    <h1 style={s.title}>Measure Your Opening</h1>
                    <p style={s.subtitle}>
                        Enter the width and height of your door or window
                        opening.
                        <br />
                        We'll place a 3D model on your wall to scale.
                    </p>
                </div>

                {/* diagram */}
                <div style={s.diagramWrap}>
                    <svg
                        viewBox="0 0 260 200"
                        style={{ width: '100%', maxWidth: 260 }}
                    >
                        {/* wall background */}
                        <rect
                            x="10"
                            y="10"
                            width="240"
                            height="180"
                            fill="#f5f7fa"
                            stroke="#dde3ea"
                            strokeWidth="1.5"
                            rx="4"
                        />
                        {/* opening */}
                        <rect
                            x="55"
                            y="35"
                            width="150"
                            height="130"
                            fill="white"
                            stroke="#608DB9"
                            strokeWidth="2"
                            strokeDasharray="6,3"
                            rx="2"
                        />
                        {/* width arrow */}
                        <line
                            x1="55"
                            y1="178"
                            x2="205"
                            y2="178"
                            stroke="#608DB9"
                            strokeWidth="1.5"
                        />
                        <polygon points="55,174 55,182 47,178" fill="#608DB9" />
                        <polygon
                            points="205,174 205,182 213,178"
                            fill="#608DB9"
                        />
                        <text
                            x="130"
                            y="193"
                            textAnchor="middle"
                            fontSize="11"
                            fill="#608DB9"
                            fontWeight="600"
                        >
                            WIDTH
                        </text>
                        {/* height arrow */}
                        <line
                            x1="18"
                            y1="35"
                            x2="18"
                            y2="165"
                            stroke="#608DB9"
                            strokeWidth="1.5"
                        />
                        <polygon points="14,35 22,35 18,27" fill="#608DB9" />
                        <polygon points="14,165 22,165 18,173" fill="#608DB9" />
                        <text
                            x="13"
                            y="108"
                            textAnchor="middle"
                            fontSize="11"
                            fill="#608DB9"
                            fontWeight="600"
                            transform="rotate(-90, 13, 108)"
                        >
                            HEIGHT
                        </text>
                        {/* corner dots */}
                        {[
                            [55, 35],
                            [205, 35],
                            [55, 165],
                            [205, 165],
                        ].map(([x, y], i) => (
                            <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="4"
                                fill="#608DB9"
                                opacity="0.7"
                            />
                        ))}
                    </svg>
                </div>

                {/* form */}
                <form onSubmit={handleSubmit} style={s.form}>
                    {/* unit toggle */}
                    <div style={s.unitRow}>
                        <span style={s.unitLabel}>Unit</span>
                        <div style={s.unitToggle}>
                            {['mm', 'cm', 'm'].map((u) => (
                                <button
                                    key={u}
                                    type="button"
                                    style={{
                                        ...s.unitBtn,
                                        ...(unit === u ? s.unitBtnActive : {}),
                                    }}
                                    onClick={() => setUnit(u)}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* inputs */}
                    <div style={s.inputRow}>
                        <div style={s.inputGroup}>
                            <label style={s.label}>Width</label>
                            <div style={s.inputWrap}>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    placeholder="e.g. 90"
                                    value={width}
                                    onChange={(e) => {
                                        setWidth(e.target.value);
                                        setErrors((p) => ({
                                            ...p,
                                            width: null,
                                        }));
                                    }}
                                    style={{
                                        ...s.input,
                                        ...(errors.width ? s.inputError : {}),
                                    }}
                                />
                                <span style={s.inputUnit}>{unit}</span>
                            </div>
                            {errors.width && (
                                <span style={s.errorMsg}>{errors.width}</span>
                            )}
                        </div>

                        <div style={s.inputDivider}>×</div>

                        <div style={s.inputGroup}>
                            <label style={s.label}>Height</label>
                            <div style={s.inputWrap}>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.1"
                                    placeholder="e.g. 210"
                                    value={height}
                                    onChange={(e) => {
                                        setHeight(e.target.value);
                                        setErrors((p) => ({
                                            ...p,
                                            height: null,
                                        }));
                                    }}
                                    style={{
                                        ...s.input,
                                        ...(errors.height ? s.inputError : {}),
                                    }}
                                />
                                <span style={s.inputUnit}>{unit}</span>
                            </div>
                            {errors.height && (
                                <span style={s.errorMsg}>{errors.height}</span>
                            )}
                        </div>
                    </div>

                    {/* preview of entered size */}
                    {width && height && !errors.width && !errors.height && (
                        <div style={s.preview}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#608DB9"
                                strokeWidth="2.5"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>
                                Opening:{' '}
                                <strong>
                                    {width} {unit}
                                </strong>{' '}
                                wide ×{' '}
                                <strong>
                                    {height} {unit}
                                </strong>{' '}
                                tall
                            </span>
                        </div>
                    )}

                    <button type="submit" style={s.submitBtn}>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                        View in AR
                    </button>
                </form>

                <p style={s.note}>
                    Tip: Measure from the inside edge of the frame to get the
                    most accurate fit.
                </p>
            </div>
        </div>
    );
}

const s = {
    root: {
        minHeight: '100vh',
        background: '#f5f7fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Segoe UI', sans-serif",
        position: 'relative',
        overflow: 'hidden',
    },
    grid: {
        position: 'absolute',
        inset: 0,
        backgroundImage:
            'linear-gradient(#dde3ea 1px, transparent 1px), linear-gradient(90deg, #dde3ea 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.4,
        pointerEvents: 'none',
    },
    card: {
        background: 'white',
        borderRadius: 20,
        padding: '36px 32px',
        width: '100%',
        maxWidth: 480,
        boxShadow: '0 8px 40px rgba(158,180,201,0.18)',
        position: 'relative',
        zIndex: 1,
    },
    header: { textAlign: 'center', marginBottom: 24 },
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: '#eef3f8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
    },
    title: {
        fontSize: 22,
        fontWeight: 700,
        color: '#1a2332',
        margin: '0 0 8px',
    },
    subtitle: { fontSize: 13, color: '#7a91a8', lineHeight: 1.6, margin: 0 },
    diagramWrap: {
        background: '#f5f7fa',
        borderRadius: 12,
        padding: '16px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'center',
    },
    form: { display: 'flex', flexDirection: 'column', gap: 16 },
    unitRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    unitLabel: { fontSize: 13, fontWeight: 600, color: '#4a5568' },
    unitToggle: {
        display: 'flex',
        background: '#f5f7fa',
        borderRadius: 8,
        padding: 3,
        gap: 2,
    },
    unitBtn: {
        padding: '5px 14px',
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        fontSize: 13,
        fontWeight: 600,
        color: '#7a91a8',
        cursor: 'pointer',
        transition: 'all 0.15s',
    },
    unitBtnActive: {
        background: 'white',
        color: '#608DB9',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    },
    inputRow: { display: 'flex', alignItems: 'flex-end', gap: 12 },
    inputGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
    inputDivider: {
        fontSize: 22,
        color: '#c5d5e4',
        paddingBottom: 10,
        fontWeight: 300,
    },
    label: {
        fontSize: 12,
        fontWeight: 700,
        color: '#4a5568',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
    input: {
        width: '100%',
        padding: '12px 40px 12px 14px',
        border: '1.5px solid #dde3ea',
        borderRadius: 10,
        fontSize: 18,
        fontWeight: 600,
        color: '#1a2332',
        outline: 'none',
        background: '#fafbfc',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s',
        appearance: 'none',
        MozAppearance: 'textfield',
    },
    inputError: { borderColor: '#fc8181' },
    inputUnit: {
        position: 'absolute',
        right: 12,
        fontSize: 12,
        fontWeight: 700,
        color: '#608DB9',
    },
    errorMsg: { fontSize: 11, color: '#e53e3e' },
    preview: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: '#eef3f8',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        color: '#4a5568',
    },
    submitBtn: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px 20px',
        background: '#608DB9',
        color: 'white',
        border: 'none',
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: 4,
        boxShadow: '0 4px 16px rgba(158,180,201,0.4)',
        transition: 'transform 0.1s, box-shadow 0.1s',
    },
    note: {
        fontSize: 11,
        color: '#aab8c5',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 0,
    },
};
