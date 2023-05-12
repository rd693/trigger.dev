import type { Meta, StoryObj } from "@storybook/react";
import { withDesign } from "storybook-addon-designs";
import { Fieldset } from "../primitives/Fieldset";
import { InputGroup } from "../primitives/InputGroup";
import { Label } from "@radix-ui/react-label";
import { Input } from "../primitives/Input";
import { Hint } from "../primitives/Hint";
import { FormError } from "../primitives/FormError";

const meta: Meta<typeof Forms> = {
  title: "Primitives/Forms",
  component: Forms,
  decorators: [withDesign],
};

export default meta;

type Story = StoryObj<typeof Forms>;

export const Basic: Story = {
  args: {
    text: "Action text",
  },

  render: (args) => <Forms />,
};

Basic.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/LKQ4FJ4bTnCSjedbRpk931/Sample-File",
  },
};

function Forms() {
  return (
    <Fieldset>
      <InputGroup>
        <Label>Organization name</Label>
        <Input
          placeholder="Your org name"
          required={true}
          defaultValue="Acme Inc."
        />
        <Hint>E.g. your company name or your workspace name.</Hint>
      </InputGroup>

      <InputGroup>
        <Label>Project name</Label>
        <Input placeholder="Your Project name" required={true} />
        <Hint>Your Jobs will live inside this Project.</Hint>
        <FormError>You must enter a project name</FormError>
      </InputGroup>
    </Fieldset>
  );
}