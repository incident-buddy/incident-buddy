import {Button} from "@/component/ui/button";
import {Label} from "@/component/ui/label";
import {Input} from "@/component/ui/input";
import {Textarea} from "@/component/ui/textarea";
import {
  type IconType,
  iconTypes,
  toIcon,
} from "@/feature/resource-master/icon";
import {createFormHook, createFormHookContexts, type Updater} from '@tanstack/react-form'
import {RadioGroup, RadioGroupItem} from "@/component/ui/radio-group";
import {Categories, type Category} from "@/feature/resource-master/category";
import {z} from "zod";
import {useDictionary} from "@/translation";

const {fieldContext, formContext} = createFormHookContexts()

const {useAppForm} = createFormHook({
  fieldComponents: {
    Input,
    Textarea,
  },
  formComponents: {
    Button,
  },
  fieldContext,
  formContext,
});

export default function Page() {
  const dict = useDictionary().page.resource;
  const form = useAppForm({
    defaultValues: {
      name: "",
      code: "",
      description: "",
      icon: "default" as IconType,
      category: "none" as Category,
    },
    validators: {
      onChange: z.object({
        name: z.string().min(1).max(100),
        code: z.string().min(1).max(100),
        description: z.string().max(300),
        icon: z.enum(iconTypes),
        category: z.enum(Categories),
      })
    },
    onSubmit: (values) => {
      console.log("Form submitted with values:", values);
    }
  })
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      await form.handleSubmit(e);
    }}>
      <div className="flex flex-col gap-y-6 max-w-2xl">
        <h2 className="text-xl font-semibold">{dict.addNewMaster}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-6">
          <div className="grid max-w-sm gap-y-2">
            <Label>{dict.master.name}</Label>
            <form.AppField name="name">{(field) =>
              <field.Input
                type="text"
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={dict.master.nameExample}/>
            }</form.AppField>
          </div>
          <div className="grid max-w-sm gap-y-2">
            <Label>{dict.master.code}</Label>
            <form.AppField name="code">{(field) =>
              <field.Input
                type="text"
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={dict.master.codeExample}/>
            }</form.AppField>
          </div>
          <div className="grid max-w-sm gap-y-2">
            <Label>{dict.master.description}</Label>
            <form.AppField name="description">{(field) =>
              <field.Textarea
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={dict.master.descriptionExample}/>
            }</form.AppField>
          </div>
          <div className="grid max-w-sm gap-y-2.5">
            <Label>{dict.master.icon}</Label>
            <form.AppField name="icon">{(field) =>
              <IconForm value={field.state.value} handleChange={field.handleChange}/>
            }</form.AppField>
          </div>
          <div className="grid max-w-sm gap-y-2.5">
            <Label>{dict.master.category}</Label>
            <form.AppField name="category">{(field) =>
              <CategoryForm value={field.state.value} handleChange={field.handleChange}/>
            }</form.AppField>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <Button
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Cancel
          </Button>

          <form.Subscribe>
            {(sub) => {
              const disabled = sub.isPristine || sub.isSubmitting || !sub.isValid;
              return (<Button type="submit" disabled={disabled}>Save</Button>);
            }}
          </form.Subscribe>
        </div>
      </div>
    </form>
  );
}

function IconForm(props: { value: IconType, handleChange: (u: Updater<IconType>) => void }) {
  const {value, handleChange} = props;
  return (
    <div className="flex items-center gap-x-3">
      {iconTypes.map((icon) => {
        let className =
          "w-10 h-10 flex items-center justify-center rounded border shadow-sm";
        if (value === icon) {
          className = `${className} border-gray-900`;
        }
        return (
          <div key={`${icon.toString()}`}>
            <div
              className={className}
              onKeyDown={() => {
              }}
              onClick={() => handleChange(icon)}
            >{toIcon(icon)}</div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryForm(props: { value: Category, handleChange: (u: Updater<Category>) => void }) {
  const dict = useDictionary().page.resource.categories;
  const {value, handleChange} = props;
  return (
    <RadioGroup>
      {Categories.map((category) => {
        const id = `category-${category}`;
        const checked = value === category;
        return (
          <div key={category} className="flex items-center space-x-2">
            <RadioGroupItem
              id={id}
              checked={checked}
              value={category}
              onClick={() => handleChange(category)}/>
            <Label htmlFor={id}>{dict[category]}</Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
