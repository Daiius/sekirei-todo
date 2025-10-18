import { Meta, StoryObj } from '@storybook/react';

import Button from '@/components/Button';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Button',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}
export default meta;

type Story = StoryObj<typeof Button>;

export const Example: Story = {
  args: {
    children: 'ボタン',
  }
}


