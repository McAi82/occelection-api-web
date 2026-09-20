// resources/js/components/common/RefreshButton.tsx
import React from 'react';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
    onClick: () => void;
    isLoading?: boolean;
    className?: string;
    label?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
    onClick,
    isLoading = false,
    className = '',
    label = 'Refresh',
}) => {
    return (
        <Button
            variant="outline"
            onClick={onClick}
            disabled={isLoading}
            className={className}
        >
            <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            {isLoading ? 'Refreshing...' : label}
        </Button>
    );
};