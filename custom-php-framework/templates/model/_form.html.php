<?php /** @var $item ?\App\Model\ModelItem */ ?>
<div class="form-group">
    <label for="typ">TYP</label>
    <input type="text" id="typ" name="model[typ]" value="<?= $item ? $item->getTyp() : '' ?>">
</div>
<div class="form-group">
    <label for="rok">ROK</label>
    <input type="number" id="rok" name="model[rok]" value="<?= $item && $item->getRok() !== null ? (int)$item->getRok() : '' ?>">
</div>
<div class="form-group">
    <label for="model">MODEL</label>
    <input type="text" id="model" name="model[model]" value="<?= $item ? $item->getModel() : '' ?>">
</div>
<div class="form-group">
    <label></label>
    <input type="submit" value="Submit">
</div>