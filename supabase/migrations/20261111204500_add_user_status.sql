begin;

alter table public."user"
	add column status text;

update public."user"
set status = 'active';

alter table public."user"
	alter column status set default 'inactive',
	alter column status set not null,
	add constraint user_status_check
		check (status in ('active', 'inactive'));

commit;
