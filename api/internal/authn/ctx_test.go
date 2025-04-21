package authn

import (
	"context"
	"reflect"
	"testing"
)

func TestRead(t *testing.T) {
	type args struct {
		ctx context.Context
	}
	tests := []struct {
		name    string
		args    args
		want    *AuthenticationContext
		wantErr bool
	}{
		{
			name: "valid context",
			args: args{
				ctx: context.WithValue(
					context.WithValue(context.Background(), TenantIdCtxKey, "tenant-id"),
					UserIdCtxKey, "user-id"),
			},
			want: &AuthenticationContext{
				TenantId: "tenant-id",
				UserId:   "user-id",
			},
			wantErr: false,
		},
		{
			name: "missing tenant ID",
			args: args{
				ctx: context.WithValue(context.Background(), UserIdCtxKey, "user-id"),
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "missing user ID",
			args: args{
				ctx: context.WithValue(context.Background(), TenantIdCtxKey, "tenant-id"),
			},
			want:    nil,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Read(tt.args.ctx)
			if (err != nil) != tt.wantErr {
				t.Errorf("Read() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(got, tt.want) {
				t.Errorf("Read() got = %v, want %v", got, tt.want)
			}
		})
	}
}
