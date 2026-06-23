import React from "react";
import figlet from "figlet";
import chalk from "chalk";
import { Box, Text } from "ink";
import { ConnectionStatus } from "../types/chat.js";

interface HeaderProps {
  model: string;
  messageCount: number;
  connectionStatus: ConnectionStatus;
  status: string;
  appMode: "translator" | "chat" | "agent";
}

const title = figlet.textSync("ENGLISH CLI", {
  font: "Slant",
  horizontalLayout: "default",
  verticalLayout: "default",
  width: 50,
  whitespaceBreak: true,
});

export const Header: React.FC<HeaderProps> = ({
  model,
  messageCount,
  connectionStatus,
  status,
  appMode,
}) => {
  const connColor = connectionStatus === "connected" ? "green" : "red";
  const statusColor =
    status === "error"
      ? "red"
      : status === "thinking"
        ? "yellow"
        : status === "calling_tool"
          ? "magenta"
          : status === "complete"
            ? "green"
            : "cyan";

  return (
    <Box marginTop={1}>
      <Text bold color="cyan">
        {chalk.whiteBright(title)}
      </Text>
    </Box>
    // {/* <Box
    //   borderStyle="round"
    //   borderColor="cyan"
    //   flexDirection="column"
    //   paddingX={0}
    //   marginBottom={0}
    // >
    //   <Box>
    //     <Text bold>Mode: </Text>
    //     <Text
    //       color={
    //         appMode.startsWith("translator")
    //           ? "magenta"
    //           : appMode === "chat"
    //             ? "blue"
    //             : "yellow"
    //       }
    //     >
    //       {appMode === "translator"
    //           ? "TRANSLATOR"
    //           : appMode.toUpperCase()}
    //     </Text>
    //   </Box>
    //   <Box>
    //     <Text bold>Model: </Text>
    //     <Text color="green">{model}</Text>
    //   </Box>
    //   <Box>
    //     <Text bold>Messages: </Text>
    //     <Text color="white">{messageCount}</Text>
    //   </Box>
    //   <Box>
    //     <Text bold>Connection: </Text>
    //     <Text color={connColor}>{connectionStatus.toUpperCase()}</Text>
    //   </Box>
    //   <Box>
    //     <Text bold>Status: </Text>
    //     <Text color={statusColor}>{status.toUpperCase()}</Text>
    //   </Box>
    // </Box> */}
  );
};
