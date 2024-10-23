import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';
import { theme } from '../../theme';

export { AssetIcon } from './asset';

type Props = SvgIconProps<'svg', { active?: boolean }>;

const ACTIVE_FILL = '#0348A2';
const ACTIVE_FILL_LIGHT = '#89B2FF';
const INACTIVE_FILL = '#747382';
const INACTIVE_FILL_LIGHT = '#CBCCCF';

const getFills = (active = false) =>
  active
    ? { primaryFill: ACTIVE_FILL, secondaryFill: ACTIVE_FILL_LIGHT }
    : { primaryFill: INACTIVE_FILL, secondaryFill: INACTIVE_FILL_LIGHT };

export function AccountsIcon({ active, ...props }: Props) {
  const { primaryFill, secondaryFill } = getFills(active);

  return (
    <SvgIcon viewBox='0 0 22 22' xmlns='http://www.w3.org/2000/svg' {...props}>
      <g>
        <path fill={secondaryFill} d='M6.5.5h15v15h-15z' />
        <path fill={primaryFill} d='M.5 6.5h15v15H.5z' />
      </g>
    </SvgIcon>
  );
}

export function AssetsIcon({ active, ...props }: Props) {
  const { primaryFill, secondaryFill } = getFills(active);

  return (
    <SvgIcon viewBox='0 0 22 22' xmlns='http://www.w3.org/2000/svg' {...props}>
      <g transform='translate(.5 .5)'>
        <circle fill={primaryFill} cx='13.5' cy='7.5' r='7.5' />
        <circle fill={secondaryFill} cx='7.5' cy='13.5' r='7.5' />
      </g>
    </SvgIcon>
  );
}

export function VaultAccountIcon(props: SvgIconProps) {
  return (
    <SvgIcon viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' {...props}>
      <path
        fill='currentColor'
        d='M11.672.056a.411.411 0 0 1 .41-.003l8.689 4.807a.45.45 0 0 1 .229.396v6.153c0 5.225-3.018 9.939-7.656 11.962l-1.323.593a.417.417 0 0 1-.344-.002l-1.172-.53C5.95 21.364 3.005 16.695 3 11.534V5.256c0-.164.086-.315.225-.394zM12 6.75l-4.5 7.5h9L12 6.75z'
      />
    </SvgIcon>
  );
}

export function DepositAddressesIcon({ active, ...props }: Props) {
  return (
    <SvgIcon xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 21' {...props}>
      <path fill={active ? ACTIVE_FILL : '#545360'} fillRule='evenodd' d='M19.629 7.5H5.125V9h14.504V7.5Z' clipRule='evenodd' />
      <path
        fill={active ? ACTIVE_FILL_LIGHT : '#B8B7C3'}
        fillRule='evenodd'
        d='M5.125 13.5h10.2V12h-10.2v1.5Z'
        clipRule='evenodd'
      />
      <circle cx='2.125' cy='8.25' r='.75' fill='#545360' />
      <circle cx='2.125' cy='12.75' r='.75' fill='#C4C4C4' />
    </SvgIcon>
  );
}

export function KeyIcon({ active, ...props }: Props) {
  return (
    <SvgIcon xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 22' {...props}>
      <g fill={active ? theme.palette.primary.main : 'currentColor'} fillRule='nonzero'>
        <path d='M15.505 4.164a.818.818 0 1 0 .578 1.395.818.818 0 0 0-.578-1.395Z' />
        <path d='M18.33 2.156A5.617 5.617 0 0 0 14.33.5c-1.51 0-2.93.588-3.998 1.656a5.594 5.594 0 0 0-1.62 3.357 5.686 5.686 0 0 0 .706 3.444L.008 18.37l2.11 2.109 1.102-1.102 1.196 1.196 1.972-1.971-1.197-1.197 1.477-1.477 1.197 1.197 1.971-1.972-1.196-1.196 2.889-2.89a5.687 5.687 0 0 0 3.444.707 5.594 5.594 0 0 0 3.357-1.62 5.617 5.617 0 0 0 1.656-3.998c0-1.51-.588-2.93-1.656-3.999Zm-1.414 4.235c-.389.39-.9.584-1.41.584a1.99 1.99 0 0 1-1.412-.584 1.997 1.997 0 0 1 0-2.821 1.997 1.997 0 0 1 2.822 0 1.997 1.997 0 0 1 0 2.821Z' />
      </g>
    </SvgIcon>
  );
}

export function WithdrawIcon({ active, ...props }: Props) {
  return (
    <SvgIcon xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 21' {...props}>
      <g fill={active ? theme.palette.primary.main : 'currentColor'}>
        <path d='M1.875 10.5a8.125 8.125 0 0 0 16.25 0h1.25a9.375 9.375 0 1 1-18.75 0h1.25Z' opacity='.407' />
        <path d='M9.423 3.625V13h1.25V3.625h-1.25Z' />
        <path d='m6.498 6.624 3.55-4.099 3.55 4.099h-7.1Z' />
      </g>
    </SvgIcon>
  );
}

export function EditIcon({ active, ...props }: Props) {
  return (
    <SvgIcon xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' {...props}>
      <g fill={active ? theme.palette.primary.main : 'currentColor'}>
        <path
          fill='currentColor'
          fillRule='evenodd'
          d='M14.053 2.386a2.518 2.518 0 0 1 3.56 3.561l-1.248 1.25h-.002L10.53 13.03a.75.75 0 0 1-.53.22H7.5a.75.75 0 0 1-.75-.75V10a.75.75 0 0 1 .22-.53zm-.72 2.841L8.25 10.311v1.439h1.44l5.083-5.083zm2.5.379-1.439-1.44.72-.719a1.018 1.018 0 0 1 1.439 1.44zm-12.542.185A2.42 2.42 0 0 1 5 5.083h2.5a.75.75 0 1 1 0 1.5H5a.917.917 0 0 0-.917.917V15a.917.917 0 0 0 .917.917h7.5a.917.917 0 0 0 .917-.917v-2.5a.75.75 0 0 1 1.5 0V15a2.417 2.417 0 0 1-2.417 2.417H5A2.416 2.416 0 0 1 2.583 15V7.5c0-.64.255-1.256.708-1.709'
          clipRule='evenodd'
        />
      </g>
    </SvgIcon>
  );
}
