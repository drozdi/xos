interface IQuery {
	isLoading: boolean
	error?: IError
	request?: Function
	data?: any
	fetch?: Function
}

type IError =
	| (any & {
			response?: {
				data?: {
					detail?: string
				}
			}
			message?: string
	  })
	| string
