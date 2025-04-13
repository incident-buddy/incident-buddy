import { Button } from "@/component/ui/button";
import { Label } from "@/component/ui/label";
import { Input } from "@/component/ui/input";
import { Textarea } from "@/component/ui/textarea";
import {
  type IconType,
  iconTypes,
  toIcon,
} from "@/feature/resource-master/icon";
import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/component/ui/radio-group";
import { Categories } from "@/feature/resource-master/category";
import { useDictionary } from "@/translation";

export default function Page() {
  const dict = useDictionary().page.resource;
  return (
    <form>
      <div className="flex flex-col gap-y-6 max-w-2xl">
        <h2 className="text-xl font-semibold">{dict.addNewMaster}</h2>
        <div className="grid grid-cols-1 gap-x-4 gap-y-6">
          <div className="grid max-w-sm gap-y-2">
            <Label>{dict.master.name}</Label>
            <Input type="text" placeholder={dict.master.nameExample} />
          </div>
          <div className="grid max-w-sm gap-y-2">
            <Label>{dict.master.code}</Label>
            <Input type="text" placeholder={dict.master.codeExample} />
          </div>
          <div className="grid max-w-sm gap-y-2">
            <Label>{dict.master.description}</Label>
            <Textarea placeholder={dict.master.descriptionExample} />
          </div>
          <div className="grid max-w-sm gap-y-2.5">
            <Label>{dict.master.icon}</Label>
            <IconForm />
          </div>
          <div className="grid max-w-sm gap-y-2.5">
            <Label>{dict.master.category}</Label>
            <CategoryForm />
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
          <Button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </form>
  );
}

function IconForm() {
  const [selected, setSelected] = useState<IconType>("default");
  return (
    <div className="flex items-center gap-x-3">
      {iconTypes.map((icon) => {
        let className =
          "w-10 h-10 flex items-center justify-center rounded border shadow-sm";
        if (selected === icon) {
          className = `${className} border-gray-900`;
        }
        return (
          <div key={`${icon.toString()}`}>
            <div
              className={className}
              onKeyDown={() => {}}
              onClick={() => setSelected(icon)}
            >
              {toIcon(icon)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CategoryForm() {
  const dict = useDictionary().page.resource.categories;
  return (
    <RadioGroup defaultValue={Categories[0]}>
      {Categories.map((category) => {
        const id = `category-${category}`;
        return (
          <div key={category} className="flex items-center space-x-2">
            <RadioGroupItem value={category} id={id} />
            <Label htmlFor={id}>{dict[category]}</Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
