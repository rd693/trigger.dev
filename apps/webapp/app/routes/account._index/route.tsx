import { conform, useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Form, useActionData } from "@remix-run/react";
import { ActionFunction, json } from "@remix-run/server-runtime";
import { z } from "zod";
import { UserProfilePhoto } from "~/components/UserProfilePhoto";
import { PageBody, PageContainer } from "~/components/layout/AppLayout";
import { BreadcrumbLink } from "~/components/navigation/Breadcrumb";
import { Button } from "~/components/primitives/Buttons";
import { Checkbox } from "~/components/primitives/Checkbox";
import { Fieldset } from "~/components/primitives/Fieldset";
import { FormButtons } from "~/components/primitives/FormButtons";
import { FormError } from "~/components/primitives/FormError";
import { Hint } from "~/components/primitives/Hint";
import { Input } from "~/components/primitives/Input";
import { InputGroup } from "~/components/primitives/InputGroup";
import { Label } from "~/components/primitives/Label";
import { PageHeader, PageTitle, PageTitleRow } from "~/components/primitives/PageHeader";
import { prisma } from "~/db.server";
import { useUser } from "~/hooks/useUser";
import { redirectWithSuccessMessage } from "~/models/message.server";
import { updateUser } from "~/models/user.server";
import { requireUserId } from "~/services/session.server";
import { Handle } from "~/utils/handle";
import { accountPath } from "~/utils/pathBuilder";

function createSchema(
  constraints: {
    isEmailUnique?: (email: string) => Promise<boolean>;
  } = {}
) {
  return z.object({
    name: z
      .string({ required_error: "You must enter a name" })
      .min(2, "Your name must be at least 2 characters long")
      .max(50),
    email: z
      .string()
      .email()
      .superRefine((email, ctx) => {
        if (constraints.isEmailUnique === undefined) {
          //client-side validation skips this
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: conform.VALIDATION_UNDEFINED,
          });
        } else {
          // Tell zod this is an async validation by returning the promise
          return constraints.isEmailUnique(email).then((isUnique) => {
            if (isUnique) {
              return;
            }

            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Email is already being used by a different account",
            });
          });
        }
      }),
    marketingEmails: z.preprocess((value) => value === "on", z.boolean()),
  });
}

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const formData = await request.formData();

  const formSchema = createSchema({
    isEmailUnique: async (email) => {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (!existingUser) {
        return true;
      }

      if (existingUser.id === userId) {
        return true;
      }

      return false;
    },
  });

  const submission = await parse(formData, { schema: formSchema, async: true });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission);
  }

  try {
    const user = await updateUser({
      id: userId,
      name: submission.value.name,
      email: submission.value.email,
      marketingEmails: submission.value.marketingEmails,
    });

    return redirectWithSuccessMessage(
      accountPath(),
      request,
      "Your account profile has been updated."
    );
  } catch (error: any) {
    return json({ errors: { body: error.message } }, { status: 400 });
  }
};

export const handle: Handle = {
  breadcrumb: (match) => {
    return <BreadcrumbLink to={match.pathname} title={"Profile"} />;
  },
};

export default function Page() {
  const user = useUser();
  const lastSubmission = useActionData();

  const [form, { name, email, marketingEmails }] = useForm({
    id: "account",
    // TODO: type this
    lastSubmission: lastSubmission as any,
    onValidate({ formData }) {
      return parse(formData, { schema: createSchema() });
    },
  });

  return (
    <PageContainer>
      <PageHeader>
        <PageTitleRow>
          <PageTitle title="Your profile" />
        </PageTitleRow>
      </PageHeader>

      <PageBody>
        <Form method="post" {...form.props} className="max-w-md">
          <InputGroup className="mb-4">
            <Label htmlFor={name.id}>Profile picture</Label>
            <UserProfilePhoto className="h-24 w-24" />
          </InputGroup>
          <Fieldset>
            <InputGroup>
              <Label htmlFor={name.id}>Full name</Label>
              <Input
                {...conform.input(name, { type: "text" })}
                placeholder="Your full name"
                defaultValue={user?.name ?? ""}
                icon="account"
              />
              <Hint>Your teammates will see this</Hint>
              <FormError id={name.errorId}>{name.error}</FormError>
            </InputGroup>
            <InputGroup>
              <Label htmlFor={email.id}>Email address</Label>
              <Input
                {...conform.input(email, { type: "text" })}
                placeholder="Your email"
                defaultValue={user?.email ?? ""}
                icon="envelope"
              />
              <FormError id={email.errorId}>{email.error}</FormError>
            </InputGroup>
            <InputGroup>
              <Label>Notifications</Label>
              <Checkbox
                id="marketingEmails"
                {...conform.input(marketingEmails, { type: "checkbox" })}
                label="Receive product updates"
                variant="simple/small"
                defaultChecked={user.marketingEmails}
              />
              <FormError id={marketingEmails.errorId}>{marketingEmails.error}</FormError>
            </InputGroup>

            <FormButtons
              confirmButton={
                <Button type="submit" variant={"primary/small"}>
                  Update
                </Button>
              }
            />
          </Fieldset>
        </Form>
      </PageBody>
    </PageContainer>
  );
}
