package domain

// FormFieldType - フィールドの型
type FormFieldType string

const (
	// FormFieldNumberInput - 単一の数値
	FormFieldNumberInput FormFieldType = "NumberInput"
	// FormFieldStringInput - 単一行の文字列
	FormFieldStringInput FormFieldType = "StringInput"
	// FormFieldTextInput - 複数行の文字列
	FormFieldTextInput FormFieldType = "TextInput"
)

// FormFieldArrayType - フィールドの値が配列か、配列であるならどういう配列か
type FormFieldArrayType string

const (
	// FormFieldArrayTypeNone - 単一の値
	FormFieldArrayTypeNone FormFieldArrayType = "None"
	// FormFieldArrayTypeMultiple - 複数の値
	FormFieldArrayTypeMultiple FormFieldArrayType = "Multiple"
)

// FromFieldIcon - フィールドのアイコン
type FromFieldIcon string

const (
	// FromFieldIconNumber - 数値
	FromFieldIconNumber FromFieldIcon = "Number"
	// FromFieldIconString - 文字列
	FromFieldIconString FromFieldIcon = "String"
	// FromFieldIconText - テキスト
	FromFieldIconText FromFieldIcon = "Text"
)
