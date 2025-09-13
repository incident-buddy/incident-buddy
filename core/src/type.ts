export type Mutation<T> = {
	diff: boolean; // 変更前後に差があるか
	outcome: T
}
