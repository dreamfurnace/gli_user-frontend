import type { Meta, StoryObj } from '@storybook/vue3'
import Input from '../components/ui/Input/Input.vue'

const meta: Meta<typeof Input> = {
  title: 'GLI/Input',
  component: Input,
  argTypes: {
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'search'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: { control: 'boolean' },
    readonly: { control: 'boolean' },
    required: { control: 'boolean' },
    invalid: { control: 'boolean' },
    loading: { control: 'boolean' },
    fullWidth: { control: 'boolean' },
    rounded: { control: 'boolean' },
    placeholder: { control: 'text' },
    label: { control: 'text' },
    helpText: { control: 'text' },
    errorMessage: { control: 'text' },
  },
  args: {
    type: 'text',
    size: 'md',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    loading: false,
    fullWidth: false,
    rounded: false,
    placeholder: '입력하세요',
    label: '라와이드 인풋',
    helpText: '',
    errorMessage: '',
  },
}
export default meta
type Story = StoryObj<typeof Input>

export const 기본: Story = {
  render: (args) => ({
    components: { Input },
    setup: () => ({ args }),
    template: '<Input v-bind="args" />',
  }),
}

export const 크기: Story = {
  render: (args) => ({
    components: { Input },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <Input size="sm" placeholder="작은 입력" />
        <Input size="md" placeholder="중간 입력" />
        <Input size="lg" placeholder="큰 입력" />
      </div>
    `,
  }),
}

export const 상태: Story = {
  render: (args) => ({
    components: { Input },
    setup: () => ({ args }),
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <Input placeholder="기본" />
        <Input placeholder="비활성화" disabled />
        <Input placeholder="읽기 전용" readonly />
        <Input placeholder="오류" invalid error-message="에러 메시지" />
        <Input placeholder="로딩" loading />
      </div>
    `,
  }),
}
