import React, { useState, useRef, useCallback } from 'react';
import Button from "../ui/button.jsx";

const Slider = ({
                    OnChange,
                    handleClearAliasing,
                    loading = false,
                    label,
                    unit,
                    min,
                    max,
                    initialValue = 0,
                    className = '',
                    errorHappened = false
                }) => {
    const [value, setValue] = useState(initialValue);
    const [isDragging, setIsDragging] = useState(false);
    const timeoutRef = useRef(null);
    const lastValueRef = useRef(initialValue);

    const sliderClasses = [
        'mt-3',
        className,
        loading ? 'opacity-50' : '',
        loading || errorHappened ? 'cursor-not-allowed' : '',
    ].filter(Boolean).join(' ');

    const handleClear = () => {
        setValue(initialValue);
        lastValueRef.current = initialValue;

        handleClearAliasing();
    }

    const handleMouseDown = useCallback(() => {
        setIsDragging(true);
        // Clear any pending timeouts when starting new interaction
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handleTouchStart = useCallback(() => {
        setIsDragging(true);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handleChange = useCallback((event) => {
        const newValue = Number(event.target.value);
        setValue(newValue);
        lastValueRef.current = newValue; // Store the latest value
    }, []);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Call OnChange after 100ms, but only if the value actually changed
        timeoutRef.current = setTimeout(() => {
            if (lastValueRef.current !== initialValue || value !== initialValue) { // Check if value changed from initial
                OnChange(lastValueRef.current);
            }
        }, 100);
    }, [OnChange, initialValue, value]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            if (lastValueRef.current !== initialValue || value !== initialValue) {
                OnChange(lastValueRef.current);
            }
        }, 100);
    }, [OnChange, initialValue, value]);

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="slider-container">
            <div className="slider">
                <div className="slider-label flex align-items-center justify-content-between">
                    <div className="w-20"></div>

                    <div className="block text-sm font-medium mb-2">{label ? label : ''}</div>

                    <Button
                        className="button btn btn-outline-danger"
                        onClick={handleClear}
                        disabled={lastValueRef.current === initialValue && value === initialValue}
                    >
                        ❌ Clear
                    </Button>
                </div>

                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={handleChange}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    disabled={loading || errorHappened}
                    className={sliderClasses}
                />

                <div className="flex justify-between text-sm text-secondary mt-1">
                    <span>{min} {unit}</span>
                    {loading ? (
                        <div>Loading...</div>
                    ) : lastValueRef.current === initialValue && value === initialValue ? (
                        <div></div>
                    ) : (
                        <div className="text-dark">{value} {unit}</div>
                    )}
                    <span>{max} {unit}</span>
                </div>
            </div>

            {isDragging && (
                <div className="mt-1 text-xs text-secondary">Dragging... release to apply</div>
            )}
        </div>
    );
};

export default Slider;