import { Input, ActionIcon } from '@mantine/core';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';

export interface NumInputProps {
    minVal?: number
    maxVal?: number
    defaultVal?: number
    val?: number
    onChanged?: (v: number) => void;
}

export default function NumInput(p: NumInputProps) {
    const [value, setValue] = useState<number>(p.defaultVal || 0);
    const min = p.minVal || 0;
    const max = p.maxVal || 100;
    const buttonHandler = (d: boolean) => {
        if (d && (value - 1) >= min) setValue(value - 1);
        else if (!d && (value + 1) <= max) setValue(value + 1);
    }
    useEffect(()=>{
        if (!!p.onChanged) p.onChanged(value);
    }, [value])
    return (<Input
        value={value}
        size='lg'
        styles={{input: { textAlign: 'center'}}}
        readOnly
        leftSection={<ActionIcon onClick={() => buttonHandler(true)} flex={1} size={'lg'} mx='6px'><CaretLeftIcon weight='duotone' /></ActionIcon>}
        rightSection={<ActionIcon onClick={() => buttonHandler(false)} flex={1} size={'lg'} mx='6px'><CaretRightIcon weight='duotone' /></ActionIcon>}
        rightSectionPointerEvents='all'
        leftSectionPointerEvents='all'
    />)
}