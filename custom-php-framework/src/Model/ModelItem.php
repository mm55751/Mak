<?php
namespace App\Model;

use App\Service\Config;

class ModelItem
{
    private ?int $id = null;
    private ?string $typ = null;
    private ?int $rok = null;
    private ?string $model = null;

    public function getId(): ?int { return $this->id; }
    public function setId(?int $id): self { $this->id = $id; return $this; }

    public function getTyp(): ?string { return $this->typ; }
    public function setTyp(?string $typ): self { $this->typ = $typ; return $this; }

    public function getRok(): ?int { return $this->rok; }
    public function setRok(?int $rok): self { $this->rok = $rok; return $this; }

    public function getModel(): ?string { return $this->model; }
    public function setModel(?string $model): self { $this->model = $model; return $this; }

    public static function fromArray($array): self
    {
        $item = new self();
        $item->fill($array);
        return $item;
    }

    public function fill($array): self
    {
        if (isset($array['id']) && ! $this->getId()) {
            $this->setId((int)$array['id']);
        }
        if (isset($array['typ'])) {
            $this->setTyp($array['typ']);
        }
        if (isset($array['rok'])) {
            $this->setRok((int)$array['rok']);
        }
        if (isset($array['model'])) {
            $this->setModel($array['model']);
        }
        return $this;
    }

    public static function findAll(): array
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $sql = 'SELECT * FROM model';
        $statement = $pdo->prepare($sql);
        $statement->execute();

        $items = [];
        $rows = $statement->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            $items[] = self::fromArray($row);
        }
        return $items;
    }

    public static function find($id): ?self
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $sql = 'SELECT * FROM model WHERE id = :id';
        $statement = $pdo->prepare($sql);
        $statement->execute(['id' => $id]);

        $row = $statement->fetch(\PDO::FETCH_ASSOC);
        if (! $row) {
            return null;
        }
        return self::fromArray($row);
    }

    public function save(): void
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        if (! $this->getId()) {
            $sql = 'INSERT INTO model (typ, rok, model) VALUES (:typ, :rok, :model)';
            $statement = $pdo->prepare($sql);
            $statement->execute([
                ':typ' => $this->getTyp(),
                ':rok' => $this->getRok(),
                ':model' => $this->getModel(),
            ]);
            $this->setId((int)$pdo->lastInsertId());
        } else {
            $sql = 'UPDATE model SET typ = :typ, rok = :rok, model = :model WHERE id = :id';
            $statement = $pdo->prepare($sql);
            $statement->execute([
                ':typ' => $this->getTyp(),
                ':rok' => $this->getRok(),
                ':model' => $this->getModel(),
                ':id' => $this->getId(),
            ]);
        }
    }

    public function delete(): void
    {
        $pdo = new \PDO(Config::get('db_dsn'), Config::get('db_user'), Config::get('db_pass'));
        $sql = 'DELETE FROM model WHERE id = :id';
        $statement = $pdo->prepare($sql);
        $statement->execute([':id' => $this->getId()]);

        $this->setId(null);
        $this->setTyp(null);
        $this->setRok(null);
        $this->setModel(null);
    }
}