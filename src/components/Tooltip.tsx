"use client";

import { BsFillQuestionDiamondFill } from 'react-icons/bs';
import { Tooltip } from "@heroui/react";

interface TooltipProps {
  content: string;
}

export const InfoTooltip: React.FC<TooltipProps> = ({content}) => {
  return (
    <Tooltip
      content={content}
      placement="top"
      className="max-w-[300px] p-4"
    >
      <BsFillQuestionDiamondFill className="w-3 h-3 text-blue-500 cursor-pointer" />
    </Tooltip>
  );
}


