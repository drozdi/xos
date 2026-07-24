import {
	ApiOutlined,
	AppstoreOutlined,
	CheckOutlined,
	CloseCircleOutlined,
	CloseOutlined,
	CompressOutlined,
	CreditCardOutlined,
	DeleteOutlined,
	EditOutlined,
	ExpandOutlined,
	ExportOutlined,
	FallOutlined,
	FileDoneOutlined,
	FileOutlined,
	HolderOutlined,
	LinkOutlined,
	LoginOutlined,
	LogoutOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	MoonOutlined,
	MoreOutlined,
	PaperClipOutlined,
	PlusOutlined,
	QuestionOutlined,
	RiseOutlined,
	SettingOutlined,
	ShareAltOutlined,
	SunOutlined,
	SwapOutlined,
	TableOutlined,
	TagsOutlined,
	UnorderedListOutlined,
	UploadOutlined,
	UserOutlined,
} from '@ant-design/icons'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
import { createElement as h, type ComponentType, type CSSProperties } from 'react'
import { camelize, capitalize, cls } from '../../utils'

type IconComponent = ComponentType<Partial<AntdIconProps>>

const ANT_ICONS: Record<string, IconComponent> = {
	TbX: CloseOutlined,
	TbClose: CloseOutlined,
	TbPlus: PlusOutlined,
	TbTrash: DeleteOutlined,
	TbCheck: CheckOutlined,
	TbPencil: EditOutlined,
	TbGripVertical: HolderOutlined,
	TbDots: MoreOutlined,
	TbCircleX: CloseCircleOutlined,
	TbSettings: SettingOutlined,
	TbMoon: MoonOutlined,
	TbSun: SunOutlined,
	TbLogin: LoginOutlined,
	TbLogout: LogoutOutlined,
	TbUserCircle: UserOutlined,
	TbArrowBarLeft: MenuFoldOutlined,
	TbArrowBarRight: MenuUnfoldOutlined,
	TbTable: TableOutlined,
	TbArrowBigUpLines: RiseOutlined,
	TbArrowBigDownLines: FallOutlined,
	TbArrowsExchange: SwapOutlined,
	TbListDetails: UnorderedListOutlined,
	TbTags: TagsOutlined,
	TbCategory: AppstoreOutlined,
	TbAccessPoint: ApiOutlined,
	TbCards: CreditCardOutlined,
	TbFileDots: FileOutlined,
	TbFileLike: FileDoneOutlined,
	TbArrowsMaximize: ExpandOutlined,
	TbArrowsMinimize: CompressOutlined,
	TbPaperclip: PaperClipOutlined,
	TbUpload: UploadOutlined,
	TbShare: ShareAltOutlined,
	TbExternalLink: ExportOutlined,
	TbLink: LinkOutlined,
}

const FALLBACK_ICON = QuestionOutlined

interface IconProps {
	children?: string
	className?: string
	name?: string
	color?: string
	as?: string
	size?: number | string
	title?: string
	[key: string]: unknown
}

const replace = (str: string) => {
	return str.replace('mdi-', 'tb-')
}

const getIcon = (name: string): IconComponent => {
	const key = capitalize(camelize(name)) as string
	return ANT_ICONS[key] ?? FALLBACK_ICON
}

export function Icon({ children, className, color, size, title, as = 'i', ...props }: IconProps) {
	if (!children) {
		return ''
	}
	color &&= color = ' text-' + color
	color ||= ''

	let name = replace(children)

	if (!/^tb-/.test(name)) {
		name = 'tb-' + name
	}
	if (name === 'tb-close') {
		name = 'tb-x'
	}

	const IconComponent = getIcon(name)
	const iconStyle: CSSProperties | undefined = size != null ? { fontSize: size } : undefined
	return h(
		as,
		{
			...props,
			className: cls(color, name.split('-')[0], name, className),
			role: 'presentation',
			'aria-hidden': 'true',
		},
		<IconComponent style={iconStyle} title={title} />,
	)
}
