# prefer-object-params

関数の引数が2つ以上の場合はオブジェクトにまとめてください。
引数をオブジェクトにまとめることで、呼び出し時の引数の順序に依存しなくなり、
引数の追加・削除が容易になります。例: `({ param1, param2 }) => ...`

```grit
or {
  `function $name($p1, $p2, $...): $ret { $body }` where {
    register_diagnostic(span=$name, message="関数の引数が2つ以上の場合はオブジェクトにまとめてください。例: ({ param1, param2 }) => ...")
  },
  `function $name($p1, $p2, $...) { $body }` where {
    register_diagnostic(span=$name, message="関数の引数が2つ以上の場合はオブジェクトにまとめてください。例: ({ param1, param2 }) => ...")
  },
  `($p1, $p2, $...): $ret => $_` where {
    register_diagnostic(span=$p1, message="関数の引数が2つ以上の場合はオブジェクトにまとめてください。例: ({ param1, param2 }) => ...")
  },
  `($p1, $p2, $...) => $_` where {
    register_diagnostic(span=$p1, message="関数の引数が2つ以上の場合はオブジェクトにまとめてください。例: ({ param1, param2 }) => ...")
  }
}
```

## Invalid: 関数宣言 (型注釈なし)

```typescript
function createIncident(title, severity) {
  return { title, severity };
}
```

## Invalid: 関数宣言 (型注釈あり)

```typescript
function createIncident(title: string, severity: string): void {
  console.log(title, severity);
}
```

## Invalid: アロー関数

```typescript
const createIncident = (title: string, severity: string): void => {
  console.log(title, severity);
};
```

## Invalid: async アロー関数

```typescript
const createIncident = async (title: string, severity: string) => {
  return { title, severity };
};
```

## Invalid: 3引数以上

```typescript
function createIncident(title: string, severity: string, description: string): void {
  console.log(title, severity, description);
}
```

## Valid: 引数が1つ

```typescript
function createIncident(title: string): void {
  console.log(title);
}
```

```typescript
function createIncident(title: string): void {
  console.log(title);
}
```

## Valid: オブジェクト分割代入 (推奨パターン)

```typescript
function createIncident({ title, severity }: { title: string; severity: string }): void {
  console.log(title, severity);
}
```

```typescript
function createIncident({ title, severity }: { title: string; severity: string }): void {
  console.log(title, severity);
}
```

## Valid: アロー関数で引数が1つ

```typescript
const createIncident = ({ title, severity }: Input): void => {
  console.log(title, severity);
};
```

```typescript
const createIncident = ({ title, severity }: Input): void => {
  console.log(title, severity);
};
```
