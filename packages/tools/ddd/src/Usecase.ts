
export interface Usecase<IRequest, IResponse> {
  execute(request?: IRequest): Promise<IResponse> | IResponse;
}
