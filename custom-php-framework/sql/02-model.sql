create table model
(
    id integer
        constraint model_pk
            primary key autoincrement,
    typ   text    not null,
    rok   integer not null,
    model text    not null
);