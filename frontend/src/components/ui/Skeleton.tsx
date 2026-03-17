import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
    variant?: 'rectangular' | 'circular' | 'text';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className,
    variant = 'rectangular'
}) => {
    const baseStyles = 'animate-pulse bg-gray-200';

    const variantStyles = {
        rectangular: 'rounded-md',
        circular: 'rounded-full',
        text: 'rounded',
    };

    return (
        <div
            className={clsx(baseStyles, variantStyles[variant], className)}
        />
    );
};

export default Skeleton;
