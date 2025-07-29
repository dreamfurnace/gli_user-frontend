import type { Meta, StoryObj } from '@storybook/vue3'
import Button from '../components/ui/Button/Button.vue'

const meta: Meta<typeof Button> = {
  title: 'GLI/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    rounded: { control: 'boolean' },
    iconOnly: { control: 'boolean' },
    iconPosition: { control: { type: 'select' }, options: ['left', 'right'] },
  },
  args: {
    variant: 'primary',
    size: 'md',
    loading: false,
    disabled: false,
    fullWidth: false,
    rounded: false,
    iconOnly: false,
    iconPosition: 'left',
  },
}
export default meta
type Story = StoryObj<typeof Button>

export const 기본: Story = {
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: '<Button v-bind="args">기본 버튼</Button>',
  }),
}

export const 변형: Story = {
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
    `,
  }),
}

export const 크기: Story = {
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <Button size="xs">XS</Button>
        <Button size="sm">SM</Button>
        <Button size="md">MD</Button>
        <Button size="lg">LG</Button>
        <Button size="xl">XL</Button>
      </div>
    `,
  }),
}
