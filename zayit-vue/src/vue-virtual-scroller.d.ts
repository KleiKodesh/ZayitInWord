declare module 'vue-virtual-scroller' {
    import { DefineComponent } from 'vue'

    export const DynamicScroller: DefineComponent<{
        items: any[]
        minItemSize: number
        keyField?: string
    }>

    export const DynamicScrollerItem: DefineComponent<{
        item: any
        active: boolean
        sizeDependencies?: any[]
    }>
}
