"use client";

import { useWebSocket } from "@/context/WebSocketContext";
import { Wifi, WifiOff, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * ConnectionStatus component
 *
 * Displays real-time WebSocket connection status to the user.
 * It shows different UI states based on whether the app is:
 * - Connected
 * - Connecting
 * - Disconnected with an error
 *
 * Provides a "Reconnect" button when the WebSocket connection fails,
 * including a loading state while attempting reconnection.
 *
 * @component
 * @returns {JSX.Element} Visual connection indicator with tooltips and optional reconnect action.
 */

export function ConnectionStatus() {
  const { isConnected, error, reconnect } = useWebSocket();
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleReconnect = async () => {
    try {
      setIsReconnecting(true);
      await reconnect();
    } catch (error) {
      console.error('Failed to reconnect:', error);
    } finally {
      setIsReconnecting(false);
    }
  };

  if (isConnected && !error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-sm text-muted-foreground">
              <Wifi className="h-4 w-4 text-green-500 mr-1" />
              <span>Connected</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Connected to real-time updates</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center text-sm text-amber-500">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>Connection lost</span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-6 text-xs"
                onClick={handleReconnect}
                disabled={isReconnecting}
              >
                {isReconnecting ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  'Reconnect'
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Error: {error.message}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center text-sm text-muted-foreground">
            <WifiOff className="h-4 w-4 text-muted-foreground/70 mr-1" />
            <span>Connecting...</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Connecting to real-time updates...</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
