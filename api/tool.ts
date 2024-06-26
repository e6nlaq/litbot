// 0埋め
export function zfill(x: number, n: number): string {
    return String(x).padStart(n, '0');
}

// オプションと引数を分離
export function format_arg(arg: string[]): [string[], Set<string>] {
    const dat = new Set<string>();
    const list: string[] = [];
    for (let i = 1; i < arg.length; ++i) {
        if (arg[i][0] !== '/') list.push(arg[i]);
        else dat.add(arg[i]);
    }

    return [list, dat];
}

// 空の要素を除外
export function remove_empty(arr: string[]): string[] {
    const res: string[] = [];
    for (let i = 0; i < arr.length; ++i) {
        if (arr[i] !== '') res.push(arr[i]);
    }

    return res;
}
