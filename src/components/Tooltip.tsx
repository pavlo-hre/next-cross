"use client";

import { BsFillQuestionDiamondFill } from 'react-icons/bs';
import { Tooltip, TooltipProps } from '@heroui/react';

interface Props extends TooltipProps {
  content: string;
}

export const InfoTooltip: React.FC<Props> = ({content, ...props}) => {
  return (
    <Tooltip
      content={content}
      placement="top"
      className="max-w-[300px] p-4 shrink-0"
      {...props}
    >
      <BsFillQuestionDiamondFill className="w-3 h-3 text-blue-500 cursor-pointer hidden md:block" />
    </Tooltip>
  );
}


